import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { OnboardingChecklist } from './OnboardingChecklist';

// Mock chrome.runtime.getManifest
vi.stubGlobal('chrome', {
  runtime: {
    getManifest: vi.fn(() => ({ version: '0.2.0' })),
  },
});

afterEach(() => cleanup());

describe('OnboardingChecklist', () => {
  it('renders extension loaded message', () => {
    render(<OnboardingChecklist />);

    expect(screen.getByText('Extension Loaded')).toBeInTheDocument();
    expect(screen.getByText('Starting X Algorithm Score...')).toBeInTheDocument();
  });

  it('calls onComplete after timeout', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<OnboardingChecklist onComplete={onComplete} />);

    // Initially not called
    expect(onComplete).not.toHaveBeenCalled();

    // Advance timers by 2.5 seconds
    vi.advanceTimersByTime(2500);

    // Should be called after timeout
    expect(onComplete).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('renders without onComplete callback', () => {
    render(<OnboardingChecklist />);

    expect(screen.getByText('Extension Loaded')).toBeInTheDocument();
  });
});
