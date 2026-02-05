import { useState, useEffect } from 'react';
import { Key, Save, RotateCcw, User } from 'lucide-react';
import { isChromeStorageAvailable, sendRuntimeMessage } from '../../lib/runtime';
import { DEFAULT_SETTINGS, type ExtensionSettings, type UserContext } from '../../types';
import { saveApiKey, getApiKey } from '../../lib/ai-analysis';

export function SettingsTab(): JSX.Element {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'none' | 'saving' | 'saved'>('none');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [userContext, setUserContext] = useState<Partial<UserContext>>({});

  // Load settings and API key
  useEffect(() => {
    if (!isChromeStorageAvailable()) return;

    sendRuntimeMessage({ type: 'GET_SETTINGS' })
      .then((loadedSettings) => {
        setSettings(loadedSettings);
        if (loadedSettings.userContext) {
          setUserContext(loadedSettings.userContext);
        }
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
      });

    getApiKey()
      .then((key) => {
        if (key) {
          setApiKey('••••••••••••' + key.slice(-8));
        }
      })
      .catch(() => {
        // Ignore
      });
  }, []);

  const handleSettingChange = async (key: keyof ExtensionSettings, value: boolean | number) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    
    try {
      await sendRuntimeMessage({
        type: 'SAVE_SETTINGS',
        payload: updated,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleSaveApiKey = async () => {
    if (apiKey && !apiKey.startsWith('••••')) {
      setApiKeyStatus('saving');
      const result = await saveApiKey(apiKey);
      if (result.success) {
        setApiKey('••••••••••••' + apiKey.slice(-8));
        setApiKeyStatus('saved');
        setTimeout(() => setApiKeyStatus('none'), 2000);
      } else {
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
      window.location.reload();
    } catch {
      // Ignore
    }
  };

  const handleUserContextChange = async (key: keyof UserContext, value: number | boolean) => {
    const updated = { ...userContext, [key]: value };
    setUserContext(updated);
    
    try {
      await sendRuntimeMessage({
        type: 'SAVE_SETTINGS',
        payload: { ...settings, userContext: updated as UserContext },
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="settings-tab">
      {/* API Key Section */}
      <div className="settings-section">
        <div className="section-header">
          <Key size={16} strokeWidth={1.5} />
          <span>Claude API Key (Optional)</span>
        </div>
        <p className="section-description">
          Enable AI-powered analysis. Get your API key from console.anthropic.com. Stored locally only.
        </p>
        
        <div className="api-key-input">
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input"
          />
          <button
            className="btn-primary btn-sm"
            onClick={handleSaveApiKey}
            disabled={apiKeyStatus === 'saving'}
          >
            {apiKeyStatus === 'saving' ? 'Saving...' :
             apiKeyStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Extension Settings */}
      <div className="settings-section">
        <div className="section-header">
          <span>Extension Settings</span>
        </div>

        <div className="settings-list">
          <label className="setting-item">
            <div>
              <div className="setting-label">Enable extension</div>
              <div className="setting-description">Master on/off switch</div>
            </div>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
              className="toggle"
            />
          </label>

          <label className="setting-item">
            <div>
              <div className="setting-label">Show score while composing</div>
              <div className="setting-description">Display overlay on X.com</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showScoreInComposer}
              onChange={(e) => handleSettingChange('showScoreInComposer', e.target.checked)}
              className="toggle"
            />
          </label>

          <label className="setting-item">
            <div>
              <div className="setting-label">Show scores on timeline</div>
              <div className="setting-description">Display score badges on existing tweets</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showScoreOnTimeline}
              onChange={(e) => handleSettingChange('showScoreOnTimeline', e.target.checked)}
              className="toggle"
            />
          </label>

          <label className="setting-item">
            <div>
              <div className="setting-label">Show suggestions</div>
              <div className="setting-description">Display improvement tips</div>
            </div>
            <input
              type="checkbox"
              checked={settings.showSuggestions}
              onChange={(e) => handleSettingChange('showSuggestions', e.target.checked)}
              className="toggle"
            />
          </label>

          <label className="setting-item">
            <div>
              <div className="setting-label">Enable animations</div>
              <div className="setting-description">Smooth transitions and effects</div>
            </div>
            <input
              type="checkbox"
              checked={settings.animationsEnabled ?? true}
              onChange={(e) => handleSettingChange('animationsEnabled', e.target.checked)}
              className="toggle"
            />
          </label>

          <label className="setting-item">
            <div>
              <div className="setting-label">Save score history</div>
              <div className="setting-description">Track your tweet scores locally</div>
            </div>
            <input
              type="checkbox"
              checked={settings.analyticsEnabled}
              onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
              className="toggle"
            />
          </label>
        </div>

        {settingsSaved && (
          <div className="success-message">
            <Save size={14} />
            Settings saved
          </div>
        )}
      </div>

      {/* User Context */}
      <div className="settings-section">
        <div className="section-header">
          <User size={16} strokeWidth={1.5} />
          <span>User Context (Optional)</span>
        </div>
        <p className="section-description">
          Provide your account details for more accurate score predictions and reach estimates.
        </p>

        <div className="user-context-inputs">
          <div className="input-group">
            <label className="input-label">Followers</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 1000"
              value={userContext.followerCount || ''}
              onChange={(e) => handleUserContextChange('followerCount', parseInt(e.target.value) || 0)}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Following</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 500"
              value={userContext.followingCount || ''}
              onChange={(e) => handleUserContextChange('followingCount', parseInt(e.target.value) || 0)}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Engagement Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="e.g., 2.5"
              value={userContext.avgEngagementRate ? (userContext.avgEngagementRate * 100).toFixed(1) : ''}
              onChange={(e) => handleUserContextChange('avgEngagementRate', (parseFloat(e.target.value) || 0) / 100)}
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Account Age (months)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 24"
              value={userContext.accountAgeMonths || ''}
              onChange={(e) => handleUserContextChange('accountAgeMonths', parseInt(e.target.value) || 0)}
              className="input"
            />
          </div>

          <label className="setting-item" style={{ marginTop: 'var(--space-2)' }}>
            <div>
              <div className="setting-label">Premium/Verified Account</div>
              <div className="setting-description">X Premium or legacy verified</div>
            </div>
            <input
              type="checkbox"
              checked={userContext.isPremium || false}
              onChange={(e) => handleUserContextChange('isPremium', e.target.checked)}
              className="toggle"
            />
          </label>
        </div>
      </div>

      {/* Advanced */}
      <div className="settings-section">
        <div className="section-header">
          <span>Advanced</span>
        </div>
        
        <button
          className="btn-secondary btn-sm"
          onClick={handleResetOnboarding}
        >
          <RotateCcw size={14} />
          Reset onboarding
        </button>
      </div>
    </div>
  );
}
