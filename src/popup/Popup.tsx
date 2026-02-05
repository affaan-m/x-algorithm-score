import { useRef, useState, useEffect } from 'react';
import { Zap, Settings as SettingsIcon, BarChart3, LineChart } from 'lucide-react';
import { scoreTweet, parseTweetFeatures } from '../lib/scoring-engine';
import { analyzeWithClaude, isAIError, type AIAnalysisResult } from '../lib/ai-analysis';
import { isChromeStorageAvailable } from '../lib/runtime';
import { DEFAULT_SETTINGS, type ExtensionSettings, type TweetScore, type DraftTweet } from '../types';
import { OnboardingChecklist } from './OnboardingChecklist';
import { AIConsentModal } from './AIConsentModal';
import { withConsent } from '../lib/consent-guard';
import { ScoreTab } from './components/ScoreTab';
import { SettingsTab } from './components/SettingsTab';
import { HistoryTab } from './components/HistoryTab';
import { DashboardTab } from './components/DashboardTab';

type Tab = 'score' | 'dashboard' | 'history' | 'settings';

export function Popup(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('score');
  const [testText, setTestText] = useState('');
  const [hasMedia, setHasMedia] = useState(false);
  const [score, setScore] = useState<TweetScore | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);

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

    // Load settings to get userContext if available
    if (isChromeStorageAvailable()) {
      chrome.storage.local.get('settings', (result) => {
        const settings = result.settings as ExtensionSettings | undefined;
        setScore(scoreTweet(tweet, settings?.userContext));
      });
    } else {
      setScore(scoreTweet(tweet));
    }
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

  // Load settings on mount and subscribe to changes
  useEffect(() => {
    if (!isChromeStorageAvailable()) return;
    
    // Load initial settings
    chrome.storage.local.get('settings', (result) => {
      const loadedSettings = (result.settings as ExtensionSettings | undefined) || DEFAULT_SETTINGS;
      setSettings(loadedSettings);
      setOnboardingCompleted(loadedSettings.onboardingCompleted === true);
    });

    // Subscribe to settings changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName !== 'local') return;
      if (changes.settings?.newValue) {
        const newSettings = changes.settings.newValue as ExtensionSettings;
        setSettings(newSettings);
        setOnboardingCompleted(newSettings.onboardingCompleted === true);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    if (!isChromeStorageAvailable()) return;
    try {
      // Load current settings, update onboardingCompleted, and save back
      const result = await chrome.storage.local.get('settings');
      const currentSettings = (result.settings as ExtensionSettings | undefined) || DEFAULT_SETTINGS;
      const updatedSettings: ExtensionSettings = {
        ...currentSettings,
        onboardingCompleted: true,
      };
      await chrome.storage.local.set({ settings: updatedSettings });
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
      <header className="popup-header">
        <div className="header-icon">
          <Zap size={20} strokeWidth={2} />
        </div>
        <div className="header-text">
          <h1 className="header-title">Algorithm Score</h1>
          <p className="header-subtitle">Optimize your tweets for maximum reach</p>
        </div>
      </header>

      {/* Tabs */}
      {onboardingCompleted && (
        <nav className="tabs" role="tablist">
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'score'}
            aria-controls="score-panel"
            className={`tab ${activeTab === 'score' ? 'active' : ''}`}
            onClick={() => setActiveTab('score')}
          >
            <Zap size={16} strokeWidth={1.5} />
            <span>Score</span>
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'dashboard'}
            aria-controls="dashboard-panel"
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LineChart size={16} strokeWidth={1.5} />
            <span>Dashboard</span>
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'history'}
            aria-controls="history-panel"
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <BarChart3 size={16} strokeWidth={1.5} />
            <span>History</span>
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={activeTab === 'settings'}
            aria-controls="settings-panel"
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon size={16} strokeWidth={1.5} />
            <span>Settings</span>
          </button>
        </nav>
      )}

      {/* Content */}
      <main className="popup-content">
        {!onboardingCompleted ? (
          <OnboardingChecklist onComplete={handleOnboardingComplete} />
        ) : (
          <>
            {activeTab === 'score' && (
              <div role="tabpanel" id="score-panel" aria-labelledby="score-tab">
                <ScoreTab
                  text={testText}
                  setText={setTestText}
                  hasMedia={hasMedia}
                  setHasMedia={setHasMedia}
                  score={score}
                  aiAnalysis={aiAnalysis}
                  isAnalyzing={isAnalyzing}
                  aiError={aiError}
                  onAnalyze={handleAIAnalysis}
                  analyticsEnabled={settings.analyticsEnabled}
                />
              </div>
            )}
            {activeTab === 'dashboard' && (
              <div role="tabpanel" id="dashboard-panel" aria-labelledby="dashboard-tab">
                <DashboardTab />
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
