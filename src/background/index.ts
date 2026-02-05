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

// Track the popup window
let popupWindowId: number | null = null;

// Handle extension icon click - open popup window
chrome.action.onClicked.addListener(async () => {
  try {
    // Check if popup window already exists
    if (popupWindowId !== null) {
      try {
        await chrome.windows.get(popupWindowId);
        // If window exists, focus it
        await chrome.windows.update(popupWindowId, { focused: true });
        return;
      } catch {
        // Window was closed, create a new one
        popupWindowId = null;
      }
    }

    // Get the current window to position popup relative to it
    const currentWindow = await chrome.windows.getCurrent();
    
    // Calculate centered position
    const width = 420;
    const height = 680;
    const left = currentWindow.left 
      ? currentWindow.left + Math.round((currentWindow.width || 1200) / 2 - width / 2)
      : Math.round((1200 - width) / 2);
    const top = currentWindow.top
      ? currentWindow.top + Math.round((currentWindow.height || 800) / 2 - height / 2)
      : Math.round((800 - height) / 2);

    // Create popup window
    const popupWindow = await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/index.html'),
      type: 'popup',
      width,
      height,
      left,
      top,
      focused: true,
    });

    popupWindowId = popupWindow.id || null;

    // Clear the stored window ID when it's closed
    chrome.windows.onRemoved.addListener((windowId) => {
      if (windowId === popupWindowId) {
        popupWindowId = null;
      }
    });
  } catch (error) {
    console.error('[X Algorithm Score] Failed to create popup window:', error);
  }
});

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
      // Store score history for analytics
      if (message.payload) {
        logScoreHistory(message.payload).then((id) => {
          sendResponse({ success: true, id });
        }).catch(() => {
          sendResponse({ success: false, id: '' });
        });
      } else {
        sendResponse({ success: false, id: '' });
      }
      return true;

    case 'UPDATE_HISTORY_ENTRY':
      updateHistoryEntry(message.payload.id, message.payload.updates).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[X Algorithm Score] Failed to update history entry:', error);
        sendResponse({ success: false });
      });
      return true;

    case 'COMPOSER_DETECTED':
      sendResponse({ success: true });
      return true;

    case 'CLEAR_HISTORY':
      chrome.storage.local.set({ scoreHistory: [] }).then(() => {
        log('[X Algorithm Score] History cleared');
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('[X Algorithm Score] Failed to clear history:', error);
        sendResponse({ success: false });
      });
      return true;

    case 'EXPORT_HISTORY':
      chrome.storage.local.get('scoreHistory').then(({ scoreHistory = [] }) => {
        sendResponse({ data: scoreHistory as ScoreLogEntry[] });
      }).catch((error) => {
        console.error('[X Algorithm Score] Failed to export history:', error);
        sendResponse({ data: [] });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown message type' });
  }
});

// Store score history for tracking prediction accuracy
async function logScoreHistory(scoreData: Omit<ScoreLogEntry, 'id'>): Promise<string> {
  try {
    const { scoreHistory = [] } = await chrome.storage.local.get('scoreHistory');

    // Generate ID if missing
    const id = crypto.randomUUID();
    
    // Normalize timestamps
    const now = Date.now();
    const entry: ScoreLogEntry = {
      ...scoreData,
      id,
      timestamp: scoreData.timestamp || now,
      createdAt: scoreData.createdAt || now,
    };

    // Keep last 100 scores
    const updatedHistory = [...scoreHistory, entry].slice(-100);

    await chrome.storage.local.set({ scoreHistory: updatedHistory });
    log('[X Algorithm Score] Score logged to history with id:', id);
    
    return id;
  } catch (error) {
    console.error('[X Algorithm Score] Failed to log score:', error);
    throw error;
  }
}

// Update an existing history entry
async function updateHistoryEntry(id: string, updates: Partial<ScoreLogEntry>): Promise<void> {
  try {
    const { scoreHistory = [] } = await chrome.storage.local.get('scoreHistory');
    
    const index = scoreHistory.findIndex((entry: ScoreLogEntry) => entry.id === id);
    
    if (index === -1) {
      throw new Error(`History entry with id ${id} not found`);
    }

    // Merge updates
    const updatedEntry: ScoreLogEntry = {
      ...scoreHistory[index],
      ...updates,
    };

    // If status changed to 'posted', update timestamp and postedAt
    if (updates.status === 'posted' && !updatedEntry.postedAt) {
      updatedEntry.postedAt = Date.now();
      updatedEntry.timestamp = updatedEntry.postedAt;
    }

    // Update the entry
    scoreHistory[index] = updatedEntry;

    await chrome.storage.local.set({ scoreHistory });
    log('[X Algorithm Score] History entry updated:', id);
  } catch (error) {
    console.error('[X Algorithm Score] Failed to update history entry:', error);
    throw error;
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
