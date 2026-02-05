export type DiagnosticCheckId = 'hostname' | 'composer' | 'settings';

export interface DiagnosticCheck {
  id: DiagnosticCheckId;
  name: string;
  passed: boolean;
  message: string;
  action: string;
  fixUrl?: string;
  onFix?: () => void;
}

interface DiagnosticsPanelProps {
  checks: DiagnosticCheck[];
}

export function DiagnosticsPanel({ checks }: DiagnosticsPanelProps): JSX.Element {
  const allPassed = checks.every((check) => check.passed);

  if (allPassed) {
    return <></>;
  }

  const renderCheckIcon = (passed: boolean): JSX.Element => (
    <div
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: passed ? '#22C55E' : '#EF4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        flexShrink: 0,
      }}
    >
      {passed ? '✓' : '✗'}
    </div>
  );

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: '#0F1419',
        borderRadius: '8px',
        border: '1px solid #38444D',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#FCA5A5', margin: 0 }}>
          Overlay not detected
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {checks.map((check) => (
          <div
            key={check.id}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#192734',
              borderRadius: '6px',
            }}
          >
            {renderCheckIcon(check.passed)}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E7E9EA' }}>
                {check.name}
              </div>
              <div style={{ fontSize: '12px', color: check.passed ? '#22C55E' : '#FCA5A5', marginTop: '4px' }}>
                {check.message}
              </div>
              {!check.passed && (
                <div style={{ marginTop: '8px' }}>
                  {check.onFix ? (
                    <button
                      onClick={check.onFix}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1DA1F2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {check.action}
                    </button>
                  ) : check.fixUrl ? (
                    <a
                      href={check.fixUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1DA1F2',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      {check.action}
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#8899A6' }}>
                      {check.action}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
