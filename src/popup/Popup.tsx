import { useState, useEffect } from 'react';
import { scoreTweet, parseTweetFeatures } from '../lib/scoring-engine';
import { analyzeWithClaude, saveApiKey, getApiKey, isAIError, type AIAnalysisResult } from '../lib/ai-analysis';
import type { TweetScore, DraftTweet } from '../types';

type Tab = 'test' | 'learn' | 'settings';

export function Popup(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('test');
  const [testText, setTestText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [score, setScore] = useState<TweetScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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

  const handleAIAnalysis = async () => {
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '480px' }}>
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
      <nav style={{
        display: 'flex',
        borderBottom: '1px solid #38444D',
      }}>
        {(['test', 'learn', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
            {tab === 'test' ? '📝 Test' : tab === 'learn' ? '📚 Learn' : '⚙️ Settings'}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {activeTab === 'test' && (
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
        )}
        {activeTab === 'learn' && <LearnTab />}
        {activeTab === 'settings' && <SettingsTab />}
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

          {/* Controversy Risk */}
          {score.controversyRisk && (
            <div style={{ marginTop: '12px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: score.controversyRisk.riskLevel === 'dangerous' ? '#450A0A' :
                                score.controversyRisk.riskLevel === 'risky' ? '#431407' :
                                score.controversyRisk.riskLevel === 'caution' ? '#422006' : '#1E2732',
                borderRadius: '8px',
                border: `1px solid ${
                  score.controversyRisk.riskLevel === 'dangerous' ? '#DC2626' :
                  score.controversyRisk.riskLevel === 'risky' ? '#EA580C' :
                  score.controversyRisk.riskLevel === 'caution' ? '#CA8A04' : '#38444D'
                }`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {score.controversyRisk.riskLevel === 'dangerous' ? '🚨' :
                     score.controversyRisk.riskLevel === 'risky' ? '⚠️' : '⚡'}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: score.controversyRisk.riskLevel === 'dangerous' ? '#FCA5A5' :
                           score.controversyRisk.riskLevel === 'risky' ? '#FDBA74' : '#FDE047',
                  }}>
                    Controversy Risk: {score.controversyRisk.riskLevel.charAt(0).toUpperCase() + score.controversyRisk.riskLevel.slice(1)}
                  </span>
                </div>
                {score.controversyRisk.warnings.slice(0, 2).map((w, i) => (
                  <div key={i} style={{
                    fontSize: '11px',
                    color: '#D1D5DB',
                    marginBottom: i < score.controversyRisk!.warnings.length - 1 ? '6px' : 0,
                    paddingLeft: '24px',
                  }}>
                    <div style={{ fontWeight: '500' }}>{w.message}</div>
                    <div style={{ color: '#9CA3AF', marginTop: '2px' }}>{w.detail}</div>
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

function SettingsTab(): JSX.Element {
  const [settings, setSettings] = useState({
    showScoreInComposer: true,
    showSuggestions: true,
    minScoreAlert: 50,
  });
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'saved' | 'saving'>('none');

  // Load API key on mount
  useEffect(() => {
    getApiKey().then((key) => {
      if (key) {
        setApiKey('••••••••••••' + key.slice(-8));
        setApiKeyStatus('saved');
      }
    });
  }, []);

  const handleSaveApiKey = async () => {
    if (apiKey && !apiKey.startsWith('••••')) {
      setApiKeyStatus('saving');
      await saveApiKey(apiKey);
      setApiKey('••••••••••••' + apiKey.slice(-8));
      setApiKeyStatus('saved');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '14px', fontWeight: '600' }}>Settings</h2>

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
      }}>
        <span style={{ fontSize: '13px' }}>Show score while composing</span>
        <input
          type="checkbox"
          checked={settings.showScoreInComposer}
          onChange={(e) => setSettings({ ...settings, showScoreInComposer: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
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
      }}>
        <span style={{ fontSize: '13px' }}>Show suggestions</span>
        <input
          type="checkbox"
          checked={settings.showSuggestions}
          onChange={(e) => setSettings({ ...settings, showSuggestions: e.target.checked })}
          style={{ accentColor: '#1DA1F2' }}
        />
      </label>

      <div style={{
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
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
        />
        <p style={{ fontSize: '11px', color: '#8899A6', margin: '8px 0 0 0' }}>
          Alert when score drops below this threshold
        </p>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        textAlign: 'center',
        marginTop: '16px',
      }}>
        <p style={{ fontSize: '12px', color: '#8899A6', margin: '0 0 8px 0' }}>
          X Algorithm Score v1.0.0
        </p>
        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
          Based on twitter/the-algorithm + community research
        </p>
      </div>
    </div>
  );
}
