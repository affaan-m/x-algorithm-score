/**
 * X Algorithm Score - Background Service Worker
 *
 * Handles:
 * - Extension installation/update
 * - Storage management
 * - Analytics (optional)
 * - Cross-tab communication
 */

import { DEFAULT_SETTINGS, type ExtensionSettings, type RuntimeMessage, type ScoreLogEntry } from '../types';

// Debug mode - set to false for production
const DEBUG = false;
const log = (...args: unknown[]): void => {
  if (DEBUG) console.log('[X Algorithm Score]', ...args);
};

// Install/update handler
chrome.runtime.onInstalled.addListener(async (details) => {
  log('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Set default settings on first install
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    log('[X Algorithm Score] Default settings initialized');
  }

  if (details.reason === 'update') {
    // Handle migration: merge new fields with existing settings
    const { settings, scoreHistory } = await chrome.storage.local.get(['settings', 'scoreHistory']);
    if (!settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
    } else {
      // Determine if user is an active user (has score history = has used the extension)
      const isActiveUser = Array.isArray(scoreHistory) && scoreHistory.length > 0;

      // Migrate existing settings by adding new fields with defaults
      const migrated: ExtensionSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,
        // Active users skip onboarding; new/inactive users see it
        onboardingCompleted: settings.onboardingCompleted ?? isActiveUser,
        aiConsentAccepted: settings.aiConsentAccepted ?? false,
        animationsEnabled: settings.animationsEnabled ?? true,
      };
      await chrome.storage.local.set({ settings: migrated });
    }
  }
});

// Message handler for communication between content script and popup
chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  log('[X Algorithm Score] Message received:', message);

  switch (message.type) {
    case 'GET_SETTINGS':
      chrome.storage.local.get('settings').then(({ settings }) => {
        sendResponse((settings || DEFAULT_SETTINGS) as ExtensionSettings);
      });
      return true; // Keep channel open for async response

    case 'SAVE_SETTINGS':
      chrome.storage.local.set({ settings: message.payload as ExtensionSettings }).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'LOG_SCORE':
      // Optional: Store score history for analytics
      if (message.payload) {
        logScoreHistory(message.payload as ScoreLogEntry);
      }
      sendResponse({ success: true });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Store score history for tracking prediction accuracy
async function logScoreHistory(scoreData: ScoreLogEntry) {
  try {
    const { scoreHistory = [] } = await chrome.storage.local.get('scoreHistory');

    // Keep last 100 scores
    const updatedHistory = [...scoreHistory, scoreData].slice(-100);

    await chrome.storage.local.set({ scoreHistory: updatedHistory });
    log('[X Algorithm Score] Score logged to history');
  } catch (error) {
    console.error('[X Algorithm Score] Failed to log score:', error);
  }
}

// Badge update (show score on extension icon)
export async function updateBadge(score: number | null): Promise<void> {
  if (score === null) {
    await chrome.action.setBadgeText({ text: '' });
    return;
  }

  const text = score.toString();
  let color: string;

  if (score >= 80) color = '#22C55E';
  else if (score >= 60) color = '#EAB308';
  else if (score >= 40) color = '#F97316';
  else color = '#EF4444';

  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color });
}

log('[X Algorithm Score] Background service worker started');
