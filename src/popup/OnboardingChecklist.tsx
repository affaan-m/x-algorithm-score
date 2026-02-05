import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface OnboardingChecklistProps {
  onComplete?: () => void;
}

export function OnboardingChecklist({ onComplete }: OnboardingChecklistProps): JSX.Element {
  useEffect(() => {
    // Auto-complete after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '400px',
      gap: '24px',
    }}>
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        padding: '24px',
        backgroundColor: '#192734',
        borderRadius: '12px',
        border: '1px solid #22C55E33',
      }}>
        <CheckCircle
          size={48}
          color="#22C55E"
          style={{ flexShrink: 0 }}
          aria-label="Complete"
        />
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#E7E9EA' }}>
            Extension Loaded
          </div>
          <div style={{ fontSize: '14px', color: '#8899A6', marginTop: '4px' }}>
            Starting X Algorithm Score...
          </div>
        </div>
      </div>
    </div>
  );
}
