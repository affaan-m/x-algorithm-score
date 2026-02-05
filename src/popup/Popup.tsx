import { useRef, useState, useEffect } from 'react';
import { scoreTweet, parseTweetFeatures } from '../lib/scoring-engine';
import { analyzeWithClaude, saveApiKey, getApiKey, isAIError, type AIAnalysisResult } from '../lib/ai-analysis';
import { isChromeStorageAvailable, sendRuntimeMessage } from '../lib/runtime';
import { DEFAULT_SETTINGS, type ExtensionSettings, type TweetScore, type DraftTweet, type ScoreLogEntry } from '../types';
import { OnboardingChecklist } from './OnboardingChecklist';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { runAllDiagnostics } from '../lib/diagnostics';
import { AIConsentModal } from './AIConsentModal';
import { withConsent } from '../lib/consent-guard';
import type { DiagnosticCheck } from './DiagnosticsPanel';

type Tab = 'test' | 'learn' | 'history' | 'settings';

export function Popup(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('test');
  const [testText, setTestText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [score, setScore] = useState<TweetScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [composerDetected, setComposerDetected] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Calculate score when text changes
  useEffect(() => {
    if (testText.trim().length === 0) {
      setScore(null);
      setAiAnalysis(null);
      return;
    }

    const features = parseTweetFeatures(testText);
    const tweet: DraftTweet = {
      text: testText,
      hasMedia,
      mediaType: hasMedia ? 'image' : undefined,
      isThread: features.isThread || false,
      hasQuestion: features.hasQuestion || false,
      externalLinks: features.externalLinks || 0,
      hashtags: features.hashtags || 0,
      mentions: features.mentions || 0,
      length: features.length || 0,
      hasEmoji: features.hasEmoji || false,
      hasCallToAction: features.hasCallToAction || false,
      isReply: false,
      quoteTweet: false,
    };

    setScore(scoreTweet(tweet));
  }, [testText, hasMedia]);

  // Consent resolution callback - stored in ref to avoid window event vulnerability
  const consentResolverRef = useRef<((accepted: boolean) => void) | null>(null);

  const handleConsentAccept = (): void => {
    setShowConsentModal(false);
    consentResolverRef.current?.(true);
    consentResolverRef.current = null;
  };

  const handleConsentDecline = (): void => {
    setShowConsentModal(false);
    consentResolverRef.current?.(false);
    consentResolverRef.current = null;
  };

  const handleAIAnalysis = async () => {
    // Check if offline
    if (!navigator.onLine) {
      setAiError('You appear to be offline. Please check your connection and try again.');
      return;
    }

    // Prevent spam clicking while analyzing
    if (isAnalyzing) return;

    try {
      await withConsent(
        async () => {
          setIsAnalyzing(true);
          setAiError(null);

          const result = await analyzeWithClaude(testText, {
            hasMedia,
            mediaType: hasMedia ? 'image' : undefined,
          });

          if (isAIError(result)) {
            setAiError(result.error);
            setAiAnalysis(null);
          } else {
            setAiAnalysis(result);
          }

          setIsAnalyzing(false);
        },
        'aiConsentAccepted',
        () => {
          return new Promise<boolean>((resolve) => {
            consentResolverRef.current = resolve;
            setShowConsentModal(true);
          });
        }
      );
    } catch (error) {
      if (error instanceof Error && error.message === 'Consent declined') {
        return;
      }
      setAiError('Analysis failed. Please try again.');
      setIsAnalyzing(false);
    }
  };

  // Load onboarding completion state on mount
  useEffect(() => {
    if (!isChromeStorageAvailable()) return;
    chrome.storage.local.get('onboardingCompleted', (result) => {
      setOnboardingCompleted(result.onboardingCompleted === true);
    });
  }, []);

  // Handle composer detection from content script
  useEffect(() => {
    const listener = (message: { type?: string }) => {
      if (message.type === 'COMPOSER_DETECTED') {
        setComposerDetected(true);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    if (!isChromeStorageAvailable()) return;
    try {
      await chrome.storage.local.set({ onboardingCompleted: true });
      setOnboardingCompleted(true);
    } catch {
      // Best-effort; ignore failures
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
      {showConsentModal && (
        <AIConsentModal
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}

      {/* Header */}
      <header style={{
        padding: '16px',
        borderBottom: '1px solid #38444D',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#1DA1F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          XS
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            X Algorithm Score
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#8899A6' }}>
            Optimize your tweets for maximum reach
          </p>
        </div>
      </header>

      {/* Tabs */}
      {onboardingCompleted && (
        <nav
          role="tablist"
          style={{
            display: 'flex',
            borderBottom: '1px solid #38444D',
          }}
        >
          {(['test', 'learn', 'history', 'settings'] as Tab[]).map((tab, idx, arr) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={activeTab === tab}
              aria-controls={`${tab}-panel`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                e.preventDefault();
                const dir = e.key === 'ArrowRight' ? 1 : -1;
                const next = (idx + dir + arr.length) % arr.length;
                setActiveTab(arr[next]);
                queueMicrotask(() => {
                  const el = e.currentTarget.parentElement?.children[next] as HTMLButtonElement;
                  el?.focus();
                });
              }}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '13px',
                fontWeight: activeTab === tab ? '600' : '400',
                color: activeTab === tab ? '#1DA1F2' : '#8899A6',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #1DA1F2' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'test'
                ? '📝 Test'
                : tab === 'learn'
                  ? '📚 Learn'
                  : tab === 'history'
                    ? '📈 History'
                    : '⚙️ Settings'}
            </button>
          ))}
        </nav>
      )}

      {/* Content */}
      <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {!onboardingCompleted ? (
          <OnboardingChecklist
            onComplete={handleOnboardingComplete}
            composerDetected={composerDetected}
          />
        ) : (
          <>
            {activeTab === 'test' && (
              <div role="tabpanel" id="test-panel" aria-labelledby="test-tab">
                <TestTab
                  text={testText}
                  setText={setTestText}
                  hasMedia={hasMedia}
                  setHasMedia={setHasMedia}
                  score={score}
                  aiAnalysis={aiAnalysis}
                  isAnalyzing={isAnalyzing}
                  aiError={aiError}
                  onAnalyze={handleAIAnalysis}
                />
              </div>
            )}
            {activeTab === 'learn' && (
              <div role="tabpanel" id="learn-panel" aria-labelledby="learn-tab">
                <LearnTab />
              </div>
            )}
            {activeTab === 'history' && (
              <div role="tabpanel" id="history-panel" aria-labelledby="history-tab">
                <HistoryTab />
              </div>
            )}
            {activeTab === 'settings' && (
              <div role="tabpanel" id="settings-panel" aria-labelledby="settings-tab">
                <SettingsTab />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface TestTabProps {
  text: string;
  setText: (text: string) => void;
  hasMedia: boolean;
  setHasMedia: (hasMedia: boolean) => void;
  score: TweetScore | null;
  aiAnalysis: AIAnalysisResult | null;
  isAnalyzing: boolean;
  aiError: string | null;
  onAnalyze: () => void;
}

function TestTab({ text, setText, hasMedia, setHasMedia, score, aiAnalysis, isAnalyzing, aiError, onAnalyze }: TestTabProps): JSX.Element {
  const gradeColors: Record<string, string> = {
    S: '#22C55E', A: '#84CC16', B: '#EAB308', C: '#F97316', D: '#EF4444', F: '#DC2626',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Text Input */}
      <div>
        <label style={{ fontSize: '12px', color: '#8899A6', marginBottom: '8px', display: 'block' }}>
          Test your tweet
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening?"
          maxLength={280}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            backgroundColor: '#192734',
            border: '1px solid #38444D',
            borderRadius: '8px',
            color: '#E7E9EA',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#8899A6', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasMedia}
              onChange={(e) => setHasMedia(e.target.checked)}
              style={{ accentColor: '#1DA1F2' }}
            />
            Has media attached
          </label>
          <span style={{ fontSize: '12px', color: text.length > 280 ? '#EF4444' : '#8899A6' }}>
            {text.length}/280
          </span>
        </div>
      </div>

      {/* Score Display */}
      {score && (
        <div style={{
          padding: '16px',
          backgroundColor: '#192734',
          borderRadius: '12px',
          border: '1px solid #38444D',
        }}>
          {/* Grade Circle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: `${gradeColors[score.grade]}20`,
              border: `3px solid ${gradeColors[score.grade]}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '24px',
              color: gradeColors[score.grade],
            }}>
              {score.grade}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{score.overall}/100</div>
              <div style={{ fontSize: '12px', color: '#8899A6' }}>
                Predicted reach: {score.predictedReach.median.toLocaleString()} impressions
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Suggestions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {score.suggestions.slice(0, 3).map((suggestion, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px',
                      backgroundColor: suggestion.type === 'negative' ? '#3D1515' :
                                      suggestion.type === 'positive' ? '#15301A' : '#1E2732',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>{suggestion.message}</div>
                    {suggestion.action && (
                      <div style={{ fontSize: '11px', color: '#8899A6', marginTop: '4px' }}>
                        💡 {suggestion.action}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || text.length === 0}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              backgroundColor: isAnalyzing ? '#1E2732' : '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isAnalyzing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isAnalyzing ? (
              <>⏳ Analyzing with Claude...</>
            ) : (
              <>🤖 Deep Analysis with AI</>
            )}
          </button>

          {/* AI Error */}
          {aiError && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: '#3D1515',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#FCA5A5',
            }}>
              {aiError}
            </div>
          )}

          {/* AI Analysis Results */}
          {aiAnalysis && (
            <div style={{ marginTop: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#A78BFA' }}>
                🤖 AI Analysis
              </h3>

              {/* Originality */}
              <div style={{
                padding: '10px',
                backgroundColor: '#1E2732',
                borderRadius: '6px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Originality: {aiAnalysis.originality.score}/100
                </div>
                <div style={{ fontSize: '11px', color: '#8899A6' }}>
                  {aiAnalysis.originality.assessment}
                </div>
              </div>

              {/* Engagement Prediction */}
              <div style={{
                padding: '10px',
                backgroundColor: '#1E2732',
                borderRadius: '6px',
                marginBottom: '8px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                  Reply Likelihood: {aiAnalysis.engagementPrediction.replyLikelihood.toUpperCase()} |
                  Viral Potential: {aiAnalysis.engagementPrediction.viralPotential.toUpperCase()}
                </div>
                <div style={{ fontSize: '11px', color: '#8899A6' }}>
                  {aiAnalysis.engagementPrediction.reasoning}
                </div>
              </div>

              {/* Rewrite Suggestions */}
              {aiAnalysis.rewriteSuggestions.length > 0 && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#15301A',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
                    ✨ Suggested Rewrite
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    padding: '8px',
                    backgroundColor: '#0D1F12',
                    borderRadius: '4px',
                    marginBottom: '4px',
                  }}>
                    "{aiAnalysis.rewriteSuggestions[0].improved}"
                  </div>
                  <div style={{ fontSize: '11px', color: '#8899A6' }}>
                    {aiAnalysis.rewriteSuggestions[0].explanation}
                  </div>
                </div>
              )}

              {/* Overall Insight */}
              <div style={{
                padding: '10px',
                backgroundColor: '#2E1065',
                borderRadius: '6px',
                fontSize: '12px',
              }}>
                <strong>Key Insight:</strong> {aiAnalysis.overallInsight}
              </div>
            </div>
          )}
        </div>
      )}

      {!score && text.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8899A6', padding: '32px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
          <p>Enter a tweet to see its algorithm score</p>
        </div>
      )}
    </div>
  );
}

function LearnTab(): JSX.Element {
  const tips = [
    {
      title: 'Reply-to-Reply = 75x Value',
      description: 'When you respond to replies on your tweet, it generates 75x more algorithmic value than a like. Engage with every comment!',
      icon: '💬',
    },
    {
      title: 'Native Video = 10x Reach',
      description: 'Videos uploaded directly to X get 10x more engagement than text-only posts. 4 out of 5 user sessions now include video.',
      icon: '🎬',
    },
    {
      title: 'Links Kill Non-Premium Reach',
      description: 'Since March 2026, non-Premium accounts with external links get ~0% median engagement. Move links to replies instead.',
      icon: '🔗',
    },
    {
      title: 'Questions Drive 13-27x Replies',
      description: 'Direct replies are weighted 13-27x more than likes. Asking questions is the easiest way to encourage replies.',
      icon: '❓',
    },
    {
      title: 'First 30 Minutes Are Critical',
      description: 'Engagement velocity in the first 30 minutes determines algorithmic distribution. Reply to comments immediately!',
      icon: '⏰',
    },
    {
      title: 'Dwell Time: 3+ Seconds',
      description: 'Users must stay on your tweet for >3 seconds to signal quality. Use hooks, threads, and engaging content.',
      icon: '👀',
    },
    {
      title: 'TweepCred Score Matters',
      description: 'Below 0.65 TweepCred, only 3 of your tweets get distributed. Maintain good follower ratio and engagement.',
      icon: '📊',
    },
    {
      title: 'Positive Tone Wins',
      description: 'Grok AI scores sentiment. Positive, constructive content gets distributed further than negative or combative posts.',
      icon: '😊',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
        Algorithm Insights (2026)
      </h2>
      <p style={{ fontSize: '12px', color: '#8899A6', marginBottom: '8px' }}>
        Based on algorithm code + community research
      </p>

      {tips.map((tip, i) => (
        <div
          key={i}
          style={{
            padding: '12px',
            backgroundColor: '#192734',
            borderRadius: '8px',
            border: '1px solid #38444D',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px' }}>{tip.icon}</span>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '0 0 4px 0' }}>
                {tip.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#8899A6', margin: 0, lineHeight: '1.4' }}>
                {tip.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryTab(): JSX.Element {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [history, setHistory] = useState<ScoreLogEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      if (!isChromeStorageAvailable()) {
        if (!cancelled) setStatus('error');
        return;
      }

      try {
        const loadedSettings = await sendRuntimeMessage({ type: 'GET_SETTINGS' });
        const { scoreHistory } = await chrome.storage.local.get('scoreHistory');

        if (cancelled) return;

        setSettings(loadedSettings);
        setHistory(Array.isArray(scoreHistory) ? (scoreHistory as ScoreLogEntry[]).slice().reverse() : []);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    const onChanged =
      typeof chrome !== 'undefined' && chrome.storage?.onChanged
        ? (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
            if (areaName !== 'local') return;
            const next = changes.scoreHistory?.newValue;
            if (!next) return;
            setHistory(Array.isArray(next) ? (next as ScoreLogEntry[]).slice().reverse() : []);
          }
        : null;

    if (onChanged) chrome.storage.onChanged.addListener(onChanged);

    return () => {
      cancelled = true;
      if (onChanged) chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const analyticsEnabled = settings?.analyticsEnabled ?? false;

  const formatTime = (timestamp: number): string => {
    const deltaMs = Date.now() - timestamp;
    if (!Number.isFinite(deltaMs)) return '';

    const sec = Math.floor(deltaMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  };

  const clearHistory = async (): Promise<void> => {
    if (!isChromeStorageAvailable()) return;
    const ok = window.confirm('Clear local score history? This only affects this device.');
    if (!ok) return;
    try {
      await chrome.storage.local.remove('scoreHistory');
      setHistory([]);
    } catch {
      // ignore (best-effort UX)
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
        Score History
      </h2>

      <div style={{ fontSize: '12px', color: '#8899A6', lineHeight: '1.4' }}>
        Stored on-device only (last 100). New entries are saved when you click Post and Analytics is enabled.
      </div>

      {!analyticsEnabled && status !== 'loading' && (
        <div style={{
          padding: '10px',
          backgroundColor: '#1E2732',
          borderRadius: '8px',
          border: '1px solid #38444D',
          fontSize: '12px',
          color: '#C9D1D9',
        }}>
          Analytics is currently off. Turn it on in Settings to save new history entries.
        </div>
      )}

      {status === 'error' && (
        <div style={{
          padding: '10px',
          backgroundColor: '#3D1515',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          fontSize: '12px',
          color: '#FCA5A5',
        }}>
          Couldn’t load score history. Please reopen the popup.
        </div>
      )}

      {status === 'ready' && history.length === 0 && (
        <div style={{ textAlign: 'center', color: '#8899A6', padding: '24px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📈</div>
          <div style={{ fontSize: '12px' }}>No score history yet.</div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => void clearHistory()}
            style={{
              alignSelf: 'flex-end',
              padding: '8px 10px',
              backgroundColor: '#1E2732',
              border: '1px solid #38444D',
              borderRadius: '8px',
              color: '#E7E9EA',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Clear history
          </button>

          {history.slice(0, 25).map((entry, idx) => (
            <div
              key={`${entry.timestamp}-${idx}`}
              style={{
                padding: '12px',
                backgroundColor: '#192734',
                borderRadius: '8px',
                border: '1px solid #38444D',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Score: {entry.score}/100
                </div>
                <div style={{ fontSize: '11px', color: '#8899A6' }}>
                  Predicted reach (median): {entry.predictedReach.median.toLocaleString()} impressions
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#8899A6', whiteSpace: 'nowrap' }}>
                {formatTime(entry.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab(): JSX.Element {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'saved' | 'saving'>('none');
  const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  const hasHydratedSettings = useRef(false);

  // Load API key on mount
  useEffect(() => {
    getApiKey().then((key) => {
      if (key) {
        setApiKey('••••••••••••' + key.slice(-8));
        setApiKeyStatus('saved');
      }
    });
  }, []);

  // Load settings on mount (single source of truth: chrome.storage via background)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await sendRuntimeMessage({ type: 'GET_SETTINGS' });
        if (!cancelled) {
          setSettings(loaded);
          setSettingsStatus('ready');
          hasHydratedSettings.current = true;
        }
      } catch {
        if (!cancelled) setSettingsStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist settings when they change (after initial load)
  useEffect(() => {
    if (settingsStatus !== 'ready') return;
    if (!hasHydratedSettings.current) return;
    let cancelled = false;
    setSettingsStatus('saving');
    const t = window.setTimeout(async () => {
      try {
        await sendRuntimeMessage({ type: 'SAVE_SETTINGS', payload: settings });
        if (!cancelled) setSettingsStatus('ready');
      } catch {
        if (!cancelled) setSettingsStatus('error');
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [settings, settingsStatus]);

  // Run diagnostics when Settings tab mounts
  useEffect(() => {
    setDiagnosticsLoading(true);
    runAllDiagnostics()
      .then(setDiagnostics)
      .catch(() => {
        // Best-effort; ignore failures
      })
      .finally(() => setDiagnosticsLoading(false));
  }, []);

  // Re-run diagnostics when settings change
  useEffect(() => {
    if (settingsStatus !== 'ready') return;
    setDiagnosticsLoading(true);
    runAllDiagnostics()
      .then(setDiagnostics)
      .catch(() => {
        // Best-effort; ignore failures
      })
      .finally(() => setDiagnosticsLoading(false));
  }, [settingsStatus]);

  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  const handleSaveApiKey = async () => {
    if (apiKey && !apiKey.startsWith('••••')) {
      setApiKeyStatus('saving');
      setApiKeyError(null);
      const result = await saveApiKey(apiKey);
      if (result.success) {
        setApiKey('••••••••••••' + apiKey.slice(-8));
        setApiKeyStatus('saved');
      } else {
        setApiKeyError(result.error || 'Failed to save API key');
        setApiKeyStatus('none');
      }
    }
  };

  const handleResetOnboarding = async () => {
    try {
      await sendRuntimeMessage({
        type: 'SAVE_SETTINGS',
        payload: { ...settings, onboardingCompleted: false },
      });
      // Reload popup to show onboarding
      window.location.reload();
    } catch {
      // Best-effort
    }
  };

  const handleRevokeAIConsent = async () => {
    try {
      await chrome.storage.local.set({ aiConsentAccepted: false });
      // Also update local settings
      setSettings({ ...settings, aiConsentAccepted: false });
    } catch {
      // Best-effort
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Settings</h2>

      {settingsStatus === 'error' && (
        <div
          role="alert"
          style={{
            padding: '10px',
            backgroundColor: '#3D1515',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontSize: '12px',
            color: '#FCA5A5',
          }}
        >
          Couldn't load or save settings. Please reopen the popup.
        </div>
      )}

      {/* Diagnostics Panel */}
      {diagnosticsLoading ? (
        <div style={{
          padding: '16px',
          backgroundColor: '#0F1419',
          borderRadius: '8px',
          border: '1px solid #38444D',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#8899A6',
        }}>
          <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
          Running diagnostics...
        </div>
      ) : (
        <DiagnosticsPanel checks={diagnostics} />
      )}

      {/* API Key Configuration */}
      <div style={{
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        border: '1px solid #7C3AED',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#A78BFA' }}>
          🤖 Claude API Key (for AI Analysis)
        </div>
        <input
          type={apiKey.startsWith('••••') ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            setApiKeyStatus('none');
          }}
          placeholder="sk-ant-api03-..."
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#0D1117',
            border: '1px solid #38444D',
            borderRadius: '4px',
            color: '#E7E9EA',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        />
        <button
          onClick={handleSaveApiKey}
          disabled={!apiKey || apiKey.startsWith('••••') || apiKeyStatus === 'saving'}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: apiKeyStatus === 'saved' ? '#15803D' : '#7C3AED',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: apiKey && !apiKey.startsWith('••••') ? 'pointer' : 'not-allowed',
            opacity: !apiKey || apiKey.startsWith('••••') ? 0.5 : 1,
          }}
        >
          {apiKeyStatus === 'saving' ? 'Saving...' : apiKeyStatus === 'saved' ? '✓ Saved' : 'Save API Key'}
        </button>
        {apiKeyError && (
          <p style={{ fontSize: '11px', color: '#FCA5A5', margin: '8px 0 0 0' }}>
            {apiKeyError}
          </p>
        )}
        <p style={{ fontSize: '10px', color: '#8899A6', margin: '8px 0 0 0' }}>
          Get your API key from console.anthropic.com. Stored locally only.
        </p>
      </div>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <span style={{ fontSize: '13px' }}>Enable extension</span>
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
      </label>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <span style={{ fontSize: '13px' }}>Show score while composing</span>
        <input
          type="checkbox"
          checked={settings.showScoreInComposer}
          onChange={(e) => setSettings({ ...settings, showScoreInComposer: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
      </label>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <div>
          <div style={{ fontSize: '13px' }}>Show score on timeline</div>
          <div style={{ fontSize: '11px', color: '#8899A6', marginTop: '2px' }}>Coming soon</div>
        </div>
        <input
          type="checkbox"
          checked={settings.showScoreOnTimeline}
          onChange={(e) => setSettings({ ...settings, showScoreOnTimeline: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={true}
        />
      </label>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <span style={{ fontSize: '13px' }}>Show suggestions</span>
        <input
          type="checkbox"
          checked={settings.showSuggestions}
          onChange={(e) => setSettings({ ...settings, showSuggestions: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
      </label>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <span style={{ fontSize: '13px' }}>Enable animations</span>
        <input
          type="checkbox"
          checked={settings.animationsEnabled}
          onChange={(e) => setSettings({ ...settings, animationsEnabled: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
      </label>

      <div style={{
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px' }}>Theme</span>
        </div>
        <select
          value={settings.darkMode}
          onChange={(e) => setSettings({ ...settings, darkMode: e.target.value as ExtensionSettings['darkMode'] })}
          disabled={settingsStatus === 'loading'}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#0D1117',
            border: '1px solid #38444D',
            borderRadius: '6px',
            color: '#E7E9EA',
            fontSize: '12px',
          }}
        >
          <option value="auto">Auto</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <p style={{ fontSize: '11px', color: '#8899A6', margin: '8px 0 0 0' }}>
          (UI currently uses a dark theme; this is reserved for future support.)
        </p>
      </div>

      <div style={{
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px' }}>Minimum score alert</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1DA1F2' }}>{settings.minScoreAlert}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.minScoreAlert}
          onChange={(e) => setSettings({ ...settings, minScoreAlert: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
        <p style={{ fontSize: '11px', color: '#8899A6', margin: '8px 0 0 0' }}>
          Alert when score drops below this threshold
        </p>
      </div>

      <label style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        cursor: 'pointer',
        opacity: settingsStatus === 'loading' ? 0.6 : 1,
      }}>
        <div>
          <div style={{ fontSize: '13px' }}>Analytics</div>
          <div style={{ fontSize: '11px', color: '#8899A6', marginTop: '2px' }}>Save score history locally when you post</div>
        </div>
        <input
          type="checkbox"
          checked={settings.analyticsEnabled}
          onChange={(e) => setSettings({ ...settings, analyticsEnabled: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
          disabled={settingsStatus === 'loading'}
        />
      </label>

      {/* Privacy & Data Section */}
      <div style={{
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        marginTop: '8px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
          Privacy & Data
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleRevokeAIConsent}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#8899A6',
              border: '1px solid #38444D',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Revoke AI consent
            <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
              Show privacy notice again before next AI analysis
            </span>
          </button>
          <button
            onClick={handleResetOnboarding}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              color: '#8899A6',
              border: '1px solid #38444D',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Reset onboarding
            <span style={{ display: 'block', fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>
              Show the setup checklist again
            </span>
          </button>
        </div>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        <p style={{ fontSize: '12px', color: '#8899A6', margin: '0 0 8px 0' }}>
          X Algorithm Score v0.2.0
        </p>
        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
          Based on twitter/the-algorithm + community research
        </p>
      </div>
    </div>
  );
}
