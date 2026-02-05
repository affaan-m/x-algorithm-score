import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export function ScoreGauge({ score, maxScore = 100 }: ScoreGaugeProps): JSX.Element {
  const [displayScore, setDisplayScore] = useState(0);
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  // Smooth count-up animation
  useEffect(() => {
    let start = 0;
    const duration = 1500; // 1.5 seconds
    const increment = score / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [score]);
  
  // Determine color based on score
  const getGaugeColor = (): string => {
    if (score >= 70) return 'var(--success)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--error)';
  };
  
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="score-gauge">
      <svg
        className="score-gauge-svg"
        width="200"
        height="200"
        viewBox="0 0 200 200"
      >
        {/* Background circle */}
        <circle
          className="score-gauge-bg"
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="12"
        />
        
        {/* Progress circle */}
        <circle
          className="score-gauge-progress"
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getGaugeColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)"
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Score text */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="central"
          className="score-gauge-text"
          style={{
            fontSize: '48px',
            fontWeight: 700,
            fill: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          {displayScore}
        </text>
      </svg>
      
      <style>{`
        .score-gauge {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }
        
        .score-gauge-svg {
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        }
        
        @keyframes gaugeGlow {
          0%, 100% {
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
          }
          50% {
            filter: drop-shadow(0 4px 20px ${getGaugeColor()}40);
          }
        }
        
        .score-gauge-progress {
          animation: gaugeGlow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
