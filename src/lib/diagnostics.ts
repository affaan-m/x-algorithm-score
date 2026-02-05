import { sendRuntimeMessage } from './runtime';
import type { DiagnosticCheck } from '../popup/DiagnosticsPanel';

/**
 * Check if user is on x.com or twitter.com
 */
export async function checkHostname(): Promise<DiagnosticCheck> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {
    return {
      id: 'hostname',
      name: 'On x.com',
      passed: false,
      message: 'Unable to determine current page',
      action: 'Open x.com',
      fixUrl: 'https://x.com',
    };
  }

  const hostname = new URL(tab.url).hostname;
  const isOnX = hostname.includes('x.com') || hostname.includes('twitter.com');

  return {
    id: 'hostname',
    name: 'On x.com',
    passed: isOnX,
    message: isOnX ? 'On x.com' : 'Not on x.com',
    action: 'Navigate to x.com',
    fixUrl: 'https://x.com',
  };
}

/**
 * Check if composer is open (queries active tab's DOM)
 */
export async function checkComposer(): Promise<DiagnosticCheck> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return {
      id: 'composer',
      name: 'Composer open',
      passed: false,
      message: 'Unable to access tab',
      action: 'Click Post button',
    };
  }

  // Check if we're on a page where we can run scripts
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return {
      id: 'composer',
      name: 'Composer open',
      passed: false,
      message: 'Cannot check on this page type',
      action: 'Navigate to x.com first',
      fixUrl: 'https://x.com',
    };
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return !!document.querySelector('[data-testid="tweetTextarea_0"]');
      },
    });

    const composerOpen = result?.result === true;

    return {
      id: 'composer',
      name: 'Composer open',
      passed: composerOpen,
      message: composerOpen ? 'Composer open' : 'Composer not open',
      action: 'Click Post button',
    };
  } catch (error) {
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('Cannot access') || errorMessage.includes('permissions')) {
      return {
        id: 'composer',
        name: 'Composer open',
        passed: false,
        message: 'Page does not allow script access',
        action: 'Navigate to x.com',
        fixUrl: 'https://x.com',
      };
    }

    return {
      id: 'composer',
      name: 'Composer open',
      passed: false,
      message: 'Unable to check composer',
      action: 'Click Post button',
    };
  }
}

/**
 * Check if extension settings are enabled
 */
export async function checkSettings(): Promise<DiagnosticCheck> {
  try {
    const settings = await sendRuntimeMessage({ type: 'GET_SETTINGS' });

    const bothEnabled = settings.enabled && settings.showScoreInComposer;

    return {
      id: 'settings',
      name: 'Extension enabled',
      passed: bothEnabled,
      message: bothEnabled
        ? 'Extension enabled and overlay visible'
        : 'Extension disabled',
      action: 'Enable in Settings',
      onFix: async () => {
        await sendRuntimeMessage({
          type: 'SAVE_SETTINGS',
          payload: { ...settings, enabled: true, showScoreInComposer: true },
        });
      },
    };
  } catch {
    return {
      id: 'settings',
      name: 'Extension enabled',
      passed: false,
      message: 'Unable to check settings',
      action: 'Enable in Settings',
    };
  }
}

/**
 * Run all diagnostic checks
 */
export async function runAllDiagnostics(): Promise<DiagnosticCheck[]> {
  const results = await Promise.all([
    checkHostname(),
    checkComposer(),
    checkSettings(),
  ]);

  return results;
}
