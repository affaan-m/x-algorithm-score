import { useState } from 'react';
import type { TweetScore, Suggestion, AlgorithmFactor } from '../../types';

interface ScoreOverlayProps {
  score: TweetScore | null;
  isVisible: boolean;
}

const gradeColors: Record<TweetScore['grade'], string> = {
  S: '#22C55E', // Green
  A: '#84CC16', // Lime
  B: '#EAB308', // Yellow
  C: '#F97316', // Orange
  D: '#EF4444', // Red
  F: '#DC2626', // Dark red
};

const gradeLabels: Record<TweetScore['grade'], string> = {
  S: 'Excellent',
  A: 'Great',
  B: 'Good',
  C: 'Fair',
  D: 'Poor',
  F: 'Needs Work',
};

export function ScoreOverlay({ score, isVisible }: ScoreOverlayProps): JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'suggestions' | 'factors'>('suggestions');

  if (!isVisible || !score) {
    return null;
  }

  const gradeColor = gradeColors[score.grade];

  return (
    <div
      style={{
        backgroundColor: '#15202B',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        color: '#E7E9EA',
        width: isExpanded ? '340px' : '120px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        border: '1px solid #38444D',
      }}
    >
      {/* Collapsed View - Score Badge */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          justifyContent: isExpanded ? 'flex-start' : 'center',
        }}
      >
        {/* Score Circle */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: `${gradeColor}20`,
            border: `3px solid ${gradeColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '18px',
            color: gradeColor,
            flexShrink: 0,
          }}
        >
          {score.grade}
        </div>

        {isExpanded && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              Score: {score.overall}/100
            </div>
            <div style={{ fontSize: '12px', color: '#8899A6' }}>
              {gradeLabels[score.grade]}
            </div>
          </div>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderTop: '1px solid #38444D',
              borderBottom: '1px solid #38444D',
            }}
          >
            {(['suggestions', 'breakdown', 'factors'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? '#1DA1F2' : '#8899A6',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #1DA1F2' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {activeTab === 'suggestions' && (
              <SuggestionsPanel suggestions={score.suggestions} />
            )}
            {activeTab === 'breakdown' && (
              <BreakdownPanel breakdown={score.breakdown} />
            )}
            {activeTab === 'factors' && (
              <FactorsPanel factors={score.algorithmFactors} />
            )}
          </div>

          {/* Controversy Risk Banner */}
          {score.controversyRisk && (
            <div
              style={{
                padding: '10px 12px',
                borderTop: '1px solid #38444D',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: score.controversyRisk.riskLevel === 'dangerous' ? '#450A0A' :
                                score.controversyRisk.riskLevel === 'risky' ? '#431407' : 'transparent',
              }}
            >
              <span style={{ fontSize: '14px' }}>
                {score.controversyRisk.riskLevel === 'dangerous' ? '🚨' :
                 score.controversyRisk.riskLevel === 'risky' ? '⚠️' : '⚡'}
              </span>
              <div style={{ fontSize: '11px' }}>
                <span style={{
                  fontWeight: '600',
                  color: score.controversyRisk.riskLevel === 'dangerous' ? '#FCA5A5' :
                         score.controversyRisk.riskLevel === 'risky' ? '#FDBA74' : '#FDE047',
                }}>
                  {score.controversyRisk.riskLevel === 'dangerous' ? 'High scandal risk' :
                   score.controversyRisk.riskLevel === 'risky' ? 'Controversy detected' : 'Minor risk flags'}
                </span>
                <span style={{ color: '#8899A6' }}>
                  {' '}&mdash; {score.controversyRisk.warnings[0]?.detail.split('.')[0]}
                </span>
              </div>
            </div>
          )}

          {/* Predicted Reach */}
          <div
            style={{
              padding: '12px',
              borderTop: '1px solid #38444D',
              fontSize: '11px',
              color: '#8899A6',
              textAlign: 'center',
            }}
          >
            Predicted reach: {score.predictedReach.low.toLocaleString()} - {score.predictedReach.high.toLocaleString()} impressions
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }): JSX.Element {
  if (suggestions.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#8899A6', fontSize: '13px', padding: '16px' }}>
        Looking good! No major issues detected.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {suggestions.slice(0, 4).map((suggestion, index) => (
        <div
          key={index}
          style={{
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: suggestion.type === 'negative' ? '#3D1515' :
                           suggestion.type === 'positive' ? '#15301A' : '#1E2732',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: suggestion.type === 'negative' ? '#EF4444' :
                              suggestion.type === 'positive' ? '#22C55E' : '#8899A6',
            }} />
            <span style={{
              fontWeight: '500',
              color: suggestion.impact === 'high' ? '#FFFFFF' : '#E7E9EA',
            }}>
              {suggestion.message}
            </span>
          </div>
          {suggestion.action && (
            <div style={{ fontSize: '11px', color: '#8899A6', marginLeft: '12px' }}>
              {suggestion.action}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BreakdownPanel({ breakdown }: { breakdown: TweetScore['breakdown'] }): JSX.Element {
  const items = [
    { label: 'Content', value: breakdown.content, max: 25 },
    { label: 'Media', value: breakdown.media, max: 20 },
    { label: 'Timing', value: breakdown.timing, max: 15 },
    { label: 'Engagement', value: breakdown.engagement, max: 20 },
    { label: 'Risk', value: -breakdown.risk, max: 20, isNegative: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item) => (
        <div key={item.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: '#E7E9EA' }}>{item.label}</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: item.isNegative ?
                (item.value < 0 ? '#EF4444' : '#22C55E') :
                (item.value / item.max > 0.6 ? '#22C55E' : item.value / item.max > 0.3 ? '#EAB308' : '#EF4444'),
            }}>
              {item.isNegative ? item.value : `${item.value}/${item.max}`}
            </span>
          </div>
          <div
            style={{
              height: '6px',
              backgroundColor: '#38444D',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.abs(item.value / item.max) * 100}%`,
                backgroundColor: item.isNegative ?
                  (item.value < 0 ? '#EF4444' : '#22C55E') :
                  (item.value / item.max > 0.6 ? '#22C55E' : item.value / item.max > 0.3 ? '#EAB308' : '#EF4444'),
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function FactorsPanel({ factors }: { factors: AlgorithmFactor[] }): JSX.Element {
  const statusColors = {
    optimal: '#22C55E',
    suboptimal: '#EAB308',
    harmful: '#EF4444',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {factors.map((factor) => (
        <div
          key={factor.name}
          style={{
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: '#1E2732',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>{factor.name}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: `${statusColors[factor.status]}20`,
                color: statusColors[factor.status],
                textTransform: 'capitalize',
              }}
            >
              {factor.status}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#8899A6', marginTop: '4px' }}>
            {factor.description}
          </div>
        </div>
      ))}
    </div>
  );
}
