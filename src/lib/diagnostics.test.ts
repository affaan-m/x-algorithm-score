/**
 * Tests for diagnostics.ts
 *
 * Note: These tests mock Chrome APIs since they're not available in test environment.
 * Full integration testing should be done manually in the browser.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock sendRuntimeMessage before imports
vi.mock('./runtime', () => ({
  sendRuntimeMessage: vi.fn(),
}));

import { checkHostname, checkComposer, checkSettings, runAllDiagnostics } from './diagnostics';
import { sendRuntimeMessage } from './runtime';
import type { ExtensionSettings } from '../types';

// Helper to create a complete settings object for tests
const createSettings = (overrides: Partial<ExtensionSettings> = {}): ExtensionSettings => ({
  enabled: true,
  showScoreInComposer: true,
  showScoreOnTimeline: false,
  showSuggestions: true,
  minScoreAlert: 50,
  darkMode: 'auto',
  analyticsEnabled: false,
  onboardingCompleted: false,
  aiConsentAccepted: false,
  animationsEnabled: true,
  ...overrides,
});

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    query: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    lastError: null,
  },
};

// Set up global chrome mock
beforeEach(() => {
  vi.stubGlobal('chrome', mockChrome);
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkHostname', () => {
  test('returns passed=true when on x.com', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'https://x.com/home' }]);

    const result = await checkHostname();

    expect(result.id).toBe('hostname');
    expect(result.passed).toBe(true);
    expect(result.message).toBe('On x.com');
  });

  test('returns passed=true when on twitter.com', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'https://twitter.com/home' }]);

    const result = await checkHostname();

    expect(result.id).toBe('hostname');
    expect(result.passed).toBe(true);
    expect(result.message).toBe('On x.com');
  });

  test('returns passed=false when on different domain', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'https://google.com' }]);

    const result = await checkHostname();

    expect(result.id).toBe('hostname');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Not on x.com');
    expect(result.fixUrl).toBe('https://x.com');
  });

  test('returns passed=false when no tab URL available', async () => {
    mockChrome.tabs.query.mockResolvedValue([{}]);

    const result = await checkHostname();

    expect(result.id).toBe('hostname');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Unable to determine current page');
  });

  test('returns passed=false when no active tab', async () => {
    mockChrome.tabs.query.mockResolvedValue([]);

    const result = await checkHostname();

    expect(result.id).toBe('hostname');
    expect(result.passed).toBe(false);
  });
});

describe('checkComposer', () => {
  test('returns passed=true when composer is detected', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: true }]);

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(true);
    expect(result.message).toBe('Composer open');
  });

  test('returns passed=false when composer is not detected', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: false }]);

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Composer not open');
    expect(result.action).toBe('Click Post button');
  });

  test('returns passed=false when no tab ID available', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ url: 'https://x.com/home' }]);

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Unable to access tab');
  });

  test('returns passed=false when on chrome:// URL', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'chrome://extensions' }]);

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Cannot check on this page type');
    expect(result.fixUrl).toBe('https://x.com');
  });

  test('returns passed=false when on chrome-extension:// URL', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'chrome-extension://abc/popup.html' }]);

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Cannot check on this page type');
  });

  test('handles scripting permission errors gracefully', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockRejectedValue(new Error('Cannot access page'));

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Page does not allow script access');
  });

  test('handles generic errors gracefully', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockRejectedValue(new Error('Unknown error'));

    const result = await checkComposer();

    expect(result.id).toBe('composer');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Unable to check composer');
  });
});

describe('checkSettings', () => {
  const mockedSendRuntimeMessage = vi.mocked(sendRuntimeMessage);

  test('returns passed=true when both enabled and showScoreInComposer are true', async () => {
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: true,
      showScoreInComposer: true,
    }));

    const result = await checkSettings();

    expect(result.id).toBe('settings');
    expect(result.passed).toBe(true);
    expect(result.message).toBe('Extension enabled and overlay visible');
  });

  test('returns passed=false when enabled is false', async () => {
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: false,
      showScoreInComposer: true,
    }));

    const result = await checkSettings();

    expect(result.id).toBe('settings');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Extension disabled');
  });

  test('returns passed=false when showScoreInComposer is false', async () => {
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: true,
      showScoreInComposer: false,
    }));

    const result = await checkSettings();

    expect(result.id).toBe('settings');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Extension disabled');
  });

  test('handles sendRuntimeMessage errors gracefully', async () => {
    mockedSendRuntimeMessage.mockRejectedValue(new Error('Runtime error'));

    const result = await checkSettings();

    expect(result.id).toBe('settings');
    expect(result.passed).toBe(false);
    expect(result.message).toBe('Unable to check settings');
  });

  test('provides onFix callback to enable settings', async () => {
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: false,
      showScoreInComposer: false,
    }));

    const result = await checkSettings();

    expect(result.onFix).toBeDefined();
    expect(typeof result.onFix).toBe('function');
  });
});

describe('runAllDiagnostics', () => {
  const mockedSendRuntimeMessage = vi.mocked(sendRuntimeMessage);

  test('returns all 3 diagnostic checks', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: true }]);
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: true,
      showScoreInComposer: true,
    }));

    const results = await runAllDiagnostics();

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.id)).toEqual(['hostname', 'composer', 'settings']);
  });

  test('returns checks in correct order', async () => {
    mockChrome.tabs.query.mockResolvedValue([{ id: 123, url: 'https://x.com/home' }]);
    mockChrome.scripting.executeScript.mockResolvedValue([{ result: false }]);
    mockedSendRuntimeMessage.mockResolvedValue(createSettings({
      enabled: true,
      showScoreInComposer: true,
    }));

    const results = await runAllDiagnostics();

    expect(results[0].id).toBe('hostname');
    expect(results[1].id).toBe('composer');
    expect(results[2].id).toBe('settings');
  });
});
