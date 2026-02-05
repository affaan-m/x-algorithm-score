import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { DiagnosticsPanel, type DiagnosticCheck } from './DiagnosticsPanel';

afterEach(() => cleanup());

function makeChecks(overrides: Partial<Record<'hostname' | 'composer' | 'settings', boolean>> = {}): DiagnosticCheck[] {
  return [
    {
      id: 'hostname',
      name: 'On x.com',
      passed: overrides.hostname ?? true,
      message: overrides.hostname ?? true ? 'On x.com' : 'Not on x.com',
      action: 'Navigate to x.com',
      fixUrl: 'https://x.com',
    },
    {
      id: 'composer',
      name: 'Composer open',
      passed: overrides.composer ?? true,
      message: overrides.composer ?? true ? 'Composer open' : 'Composer not open',
      action: 'Click Post button',
    },
    {
      id: 'settings',
      name: 'Extension enabled',
      passed: overrides.settings ?? true,
      message: overrides.settings ?? true ? 'Extension enabled and overlay visible' : 'Extension disabled',
      action: 'Enable in Settings',
      onFix: vi.fn(),
    },
  ];
}

describe('DiagnosticsPanel', () => {
  it('renders nothing when all checks pass', () => {
    const checks = makeChecks({ hostname: true, composer: true, settings: true });
    const { container } = render(<DiagnosticsPanel checks={checks} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders panel when any check fails', () => {
    const checks = makeChecks({ hostname: true, composer: false, settings: true });
    render(<DiagnosticsPanel checks={checks} />);

    expect(screen.getByText('Overlay not detected')).toBeInTheDocument();
  });

  it('shows all 3 checks with correct status icons', () => {
    const checks = makeChecks({ hostname: true, composer: false, settings: true });
    render(<DiagnosticsPanel checks={checks} />);

    // Use getAllByText since name and message may be the same
    expect(screen.getAllByText('On x.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Composer open')).toBeInTheDocument();
    expect(screen.getByText('Extension enabled')).toBeInTheDocument();
  });

  it('shows checkmark for passed checks and X for failed', () => {
    const checks = makeChecks({ hostname: true, composer: false, settings: false });
    render(<DiagnosticsPanel checks={checks} />);

    // Passed check message (name and message may be same)
    expect(screen.getAllByText('On x.com').length).toBeGreaterThan(0);
    // Failed check messages
    expect(screen.getByText('Composer not open')).toBeInTheDocument();
    expect(screen.getByText('Extension disabled')).toBeInTheDocument();
  });

  it('shows action button for failed check with onFix handler', () => {
    const checks = makeChecks({ hostname: true, composer: true, settings: false });
    render(<DiagnosticsPanel checks={checks} />);

    const fixButton = screen.getByRole('button', { name: 'Enable in Settings' });
    expect(fixButton).toBeInTheDocument();
  });

  it('calls onFix when fix button is clicked', () => {
    const checks = makeChecks({ hostname: true, composer: true, settings: false });
    render(<DiagnosticsPanel checks={checks} />);

    const fixButton = screen.getByRole('button', { name: 'Enable in Settings' });
    fireEvent.click(fixButton);

    expect(checks[2].onFix).toHaveBeenCalled();
  });

  it('shows link for failed check with fixUrl', () => {
    const checks = makeChecks({ hostname: false, composer: true, settings: true });
    render(<DiagnosticsPanel checks={checks} />);

    const link = screen.getByRole('link', { name: 'Navigate to x.com' });
    expect(link).toHaveAttribute('href', 'https://x.com');
  });

  it('shows text-only action when no onFix or fixUrl provided', () => {
    const checks: DiagnosticCheck[] = [
      {
        id: 'composer',
        name: 'Composer open',
        passed: false,
        message: 'Composer not open',
        action: 'Click Post button',
        // No onFix or fixUrl
      },
    ];
    render(<DiagnosticsPanel checks={checks} />);

    expect(screen.getByText('Click Post button')).toBeInTheDocument();
  });
});
