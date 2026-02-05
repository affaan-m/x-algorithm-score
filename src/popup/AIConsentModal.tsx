import { useEffect, useRef } from 'react';

interface AIConsentModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function AIConsentModal({ onAccept, onDecline }: AIConsentModalProps): JSX.Element {
  const modalRef = useRef<HTMLDivElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap implementation
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the accept button on mount
    acceptButtonRef.current?.focus();

    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onDecline();
      }
    };

    modal.addEventListener('keydown', handleTab);
    document.addEventListener('keydown', handleEscape);

    return () => {
      modal.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onDecline]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-consent-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          backgroundColor: '#192734',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          border: '1px solid #38444D',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2
          id="ai-consent-title"
          style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#E7E9EA',
            margin: '0 0 12px 0',
          }}
        >
          AI Privacy Notice
        </h2>

        <p
          style={{
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#8899A6',
            marginBottom: '20px',
            margin: '0 0 20px 0',
          }}
        >
          Your draft text will be sent to Anthropic's API using your API key. We never see or store your data.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
          <button
            onClick={onAccept}
            ref={acceptButtonRef}
            style={{
              padding: '12px',
              backgroundColor: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            I understand, continue
          </button>

          <button
            onClick={onDecline}
            style={{
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#8899A6',
              border: '1px solid #38444D',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
