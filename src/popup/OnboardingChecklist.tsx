import { useEffect, useState } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

type OnboardingStep = 1 | 2 | 3;

interface OnboardingChecklistProps {
  onComplete?: () => void;
  composerDetected?: boolean;
}

interface StepState {
  loaded: boolean;
  pinned: boolean;
  composerDetected: boolean;
}

export function OnboardingChecklist({ onComplete, composerDetected: externalComposerDetected }: OnboardingChecklistProps): JSX.Element {
  const [steps, setSteps] = useState<StepState>({
    loaded: false,
    pinned: false,
    composerDetected: false,
  });
  const [manualPinnedChecked, setManualPinnedChecked] = useState(false);

  useEffect(() => {
    detectLoadedState();
  }, []);

  // Update composerDetected from external listener in Popup
  useEffect(() => {
    if (externalComposerDetected) {
      setSteps((prev) => ({ ...prev, composerDetected: true }));
    }
  }, [externalComposerDetected]);

  useEffect(() => {
    if (steps.loaded && steps.pinned && steps.composerDetected) {
      onComplete?.();
    }
  }, [steps, onComplete]);

  const detectLoadedState = (): void => {
    try {
      chrome.runtime.getManifest();
      setSteps((prev) => ({ ...prev, loaded: true }));
    } catch {
      setSteps((prev) => ({ ...prev, loaded: true }));
    }
  };

  const handleManualPinned = (): void => {
    setManualPinnedChecked(true);
    setSteps((prev) => ({ ...prev, pinned: true }));
  };

  const renderCheckCircle = (isComplete: boolean): JSX.Element => (
    isComplete ? (
      <CheckCircle
        size={20}
        color="#22C55E"
        style={{ flexShrink: 0 }}
        aria-label="Complete"
      />
    ) : (
      <Circle
        size={20}
        color="#8899A6"
        style={{ flexShrink: 0 }}
        aria-label="Pending"
      />
    )
  );

  const renderStep = (
    step: OnboardingStep,
    title: string,
    isComplete: boolean,
    subtitle?: string,
    action?: JSX.Element,
  ): JSX.Element => (
    <div
      key={step}
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#192734',
        borderRadius: '8px',
        border: `1px solid ${isComplete ? '#22C55E33' : '#38444D'}`,
      }}
    >
      {renderCheckCircle(isComplete)}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#E7E9EA' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#8899A6', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
        {action && <div style={{ marginTop: '8px' }}>{action}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
        Get Started
      </div>
      <div style={{ fontSize: '12px', color: '#8899A6', marginBottom: '8px' }}>
        Complete these 3 steps to start using the extension
      </div>

      {renderStep(
        1,
        'Extension Loaded',
        steps.loaded,
        steps.loaded ? 'Extension loaded' : 'Loading...',
      )}

      {renderStep(
        2,
        'Pin Extension',
        steps.pinned,
        steps.pinned ? 'Extension pinned' : 'Click puzzle icon, find X Algorithm Score, click pin',
        !steps.pinned ? (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#8899A6',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={manualPinnedChecked}
              onChange={handleManualPinned}
              style={{ accentColor: '#1DA1F2' }}
            />
            I have pinned the extension
          </label>
        ) : undefined,
      )}

      {renderStep(
        3,
        'Test Overlay',
        steps.composerDetected,
        steps.composerDetected ? 'Overlay working' : 'Go to x.com and click Post button',
      )}
    </div>
  );
}
