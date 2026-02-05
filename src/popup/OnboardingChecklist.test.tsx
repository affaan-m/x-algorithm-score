import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { OnboardingChecklist } from './OnboardingChecklist';

// Mock chrome.runtime.getManifest
vi.stubGlobal('chrome', {
  runtime: {
    getManifest: vi.fn(() => ({ version: '0.2.0' })),
  },
});

afterEach(() => cleanup());

describe('OnboardingChecklist', () => {
  it('renders with 3 steps', () => {
    render(<OnboardingChecklist />);

    expect(screen.getByText('Extension Loaded')).toBeInTheDocument();
    expect(screen.getByText('Pin Extension')).toBeInTheDocument();
    expect(screen.getByText('Test Overlay')).toBeInTheDocument();
  });

  it('auto-checks step 1 (Extension Loaded) on mount', () => {
    render(<OnboardingChecklist />);

    // Step 1 should show "Extension loaded" status
    expect(screen.getByText('Extension loaded')).toBeInTheDocument();
  });

  it('shows manual checkbox for step 2 when not pinned', () => {
    render(<OnboardingChecklist />);

    const checkbox = screen.getByRole('checkbox', { name: /i have pinned the extension/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('marks step 2 complete when manual checkbox is checked', () => {
    render(<OnboardingChecklist />);

    const checkbox = screen.getByRole('checkbox', { name: /i have pinned the extension/i });
    fireEvent.click(checkbox);

    expect(screen.getByText('Extension pinned')).toBeInTheDocument();
  });

  it('marks step 3 complete when composerDetected prop is true', () => {
    render(<OnboardingChecklist composerDetected={true} />);

    expect(screen.getByText('Overlay working')).toBeInTheDocument();
  });

  it('calls onComplete when all 3 steps are complete', () => {
    const onComplete = vi.fn();

    render(
      <OnboardingChecklist
        onComplete={onComplete}
        composerDetected={true}
      />
    );

    // Check the manual pin checkbox to complete step 2
    const checkbox = screen.getByRole('checkbox', { name: /i have pinned the extension/i });
    fireEvent.click(checkbox);

    // onComplete should be called when all steps are done
    expect(onComplete).toHaveBeenCalled();
  });

  it('shows pending state for incomplete steps', () => {
    render(<OnboardingChecklist composerDetected={false} />);

    // Step 3 should show pending message
    expect(screen.getByText('Go to x.com and click Post button')).toBeInTheDocument();
  });
});
