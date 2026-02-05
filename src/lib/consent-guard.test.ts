import { describe, expect, it, vi, beforeEach } from 'vitest';
import { withConsent } from './consent-guard';

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((key: string) => Promise.resolve({ [key]: mockStorage[key] })),
      set: vi.fn((obj: Record<string, unknown>) => {
        Object.assign(mockStorage, obj);
        return Promise.resolve();
      }),
    },
  },
});

beforeEach(() => {
  // Reset mock storage
  Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  vi.clearAllMocks();
});

describe('withConsent', () => {
  it('calls action directly when consent already accepted', async () => {
    mockStorage['aiConsentAccepted'] = true;
    const action = vi.fn().mockResolvedValue('result');
    const showModal = vi.fn();

    const result = await withConsent(action, 'aiConsentAccepted', showModal);

    expect(result).toBe('result');
    expect(action).toHaveBeenCalledOnce();
    expect(showModal).not.toHaveBeenCalled();
  });

  it('shows modal when consent not accepted', async () => {
    mockStorage['aiConsentAccepted'] = false;
    const action = vi.fn().mockResolvedValue('result');
    const showModal = vi.fn().mockResolvedValue(true); // User accepts

    const result = await withConsent(action, 'aiConsentAccepted', showModal);

    expect(showModal).toHaveBeenCalledOnce();
    expect(action).toHaveBeenCalledOnce();
    expect(result).toBe('result');
  });

  it('stores consent and proceeds when user accepts', async () => {
    mockStorage['aiConsentAccepted'] = false;
    const action = vi.fn().mockResolvedValue('success');
    const showModal = vi.fn().mockResolvedValue(true); // User accepts

    await withConsent(action, 'aiConsentAccepted', showModal);

    // Verify consent was stored
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ aiConsentAccepted: true });
    expect(mockStorage['aiConsentAccepted']).toBe(true);
  });

  it('rejects when user declines consent', async () => {
    mockStorage['aiConsentAccepted'] = false;
    const action = vi.fn().mockResolvedValue('result');
    const showModal = vi.fn().mockResolvedValue(false); // User declines

    await expect(withConsent(action, 'aiConsentAccepted', showModal))
      .rejects.toThrow('Consent declined');

    expect(action).not.toHaveBeenCalled();
  });

  it('does not store consent when user declines', async () => {
    mockStorage['aiConsentAccepted'] = false;
    const action = vi.fn();
    const showModal = vi.fn().mockResolvedValue(false); // User declines

    try {
      await withConsent(action, 'aiConsentAccepted', showModal);
    } catch {
      // Expected to throw
    }

    // Consent should NOT be stored
    expect(mockStorage['aiConsentAccepted']).toBe(false);
  });

  it('works with custom consent key', async () => {
    mockStorage['customConsent'] = true;
    const action = vi.fn().mockResolvedValue('result');
    const showModal = vi.fn();

    const result = await withConsent(action, 'customConsent', showModal);

    expect(result).toBe('result');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('customConsent');
  });

  it('consent persists across calls', async () => {
    // First call - user accepts
    mockStorage['aiConsentAccepted'] = false;
    const action1 = vi.fn().mockResolvedValue('first');
    const showModal1 = vi.fn().mockResolvedValue(true);
    await withConsent(action1, 'aiConsentAccepted', showModal1);

    // Second call - should not show modal
    const action2 = vi.fn().mockResolvedValue('second');
    const showModal2 = vi.fn();
    const result = await withConsent(action2, 'aiConsentAccepted', showModal2);

    expect(showModal2).not.toHaveBeenCalled();
    expect(result).toBe('second');
  });
});
