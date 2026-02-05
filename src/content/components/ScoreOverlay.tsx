import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react';
import type { TweetScore, Suggestion, AlgorithmFactor, ExtensionSettings } from '../../types';

interface ScoreOverlayProps {
  score: TweetScore | null;
  isVisible: boolean;
  settings?: Pick<ExtensionSettings, 'showSuggestions' | 'minScoreAlert' | 'animationsEnabled'>;
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

export function ScoreOverlay({ score, isVisible, settings }: ScoreOverlayProps): JSX.Element | null {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'suggestions' | 'factors'>('suggestions');
  const [isPeeked, setIsPeeked] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);
  const tabsId = useId();

  if (!isVisible) {
    return null;
  }

  const hasScore = !!score;
  const gradeColor = hasScore ? gradeColors[score.grade] : '#1DA1F2';
  const gradeLabel = hasScore ? gradeLabels[score.grade] : 'Ready';
  const showSuggestions = settings?.showSuggestions ?? true;
  const minScoreAlert = settings?.minScoreAlert ?? 50;
  const animationsEnabled = settings?.animationsEnabled ?? true;
  const isBelowTarget = hasScore ? score.overall < minScoreAlert : false;

  const topSuggestion = useMemo(() => {
    if (!showSuggestions) return null;
    if (!score?.suggestions?.length) return null;
    // Prefer high-impact suggestions first
    const sorted = [...score.suggestions].sort((a, b) => {
      const weight = (impact: Suggestion['impact']) => (impact === 'high' ? 3 : impact === 'medium' ? 2 : 1);
      return weight(b.impact) - weight(a.impact);
    });
    return sorted[0] ?? null;
  }, [score?.suggestions]);

  // Auto-collapse if score disappears (composer cleared) to avoid confusing state
  useEffect(() => {
    if (!score) {
      setIsExpanded(false);
      setActiveTab(showSuggestions ? 'suggestions' : 'breakdown');
    }
  }, [score]);

  useEffect(() => {
    if (activeTab === 'suggestions' && !showSuggestions) {
      setActiveTab('breakdown');
    }
  }, [activeTab, showSuggestions]);

  // Pulse when overall score changes (subtle premium feedback)
  useEffect(() => {
    if (!score) return;
    if (!animationsEnabled) return;
    setScorePulse(true);
    const t = window.setTimeout(() => setScorePulse(false), 320);
    return () => window.clearTimeout(t);
  }, [score?.overall, animationsEnabled]);

  // Escape collapses expanded overlay
  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  const expanded = isExpanded && hasScore;
  const peek = !expanded && (isPeeked || isFocused) && (hasScore || !!topSuggestion);
  const cardTitle = hasScore ? `Score: ${score.overall}/100` : 'Start typing to score';

  return (
    <div
      className="xas-card"
      data-expanded={expanded}
      data-peek={peek}
      style={{ ['--xas-grade' as unknown as string]: gradeColor } as CSSProperties}
    >
      {/* Screen reader announcement for score changes */}
      <div className="xas-srOnly" aria-live="polite" aria-atomic="true">
        {hasScore ? `Score ${score.overall} out of 100, grade ${score.grade}, ${gradeLabel}` : ''}
      </div>

      {/* Header button */}
      <button
        type="button"
        className="xas-headerBtn"
        aria-expanded={expanded}
        aria-controls={`${tabsId}-panel`}
        aria-label={
          hasScore
            ? expanded
              ? 'Collapse score details'
              : 'Expand score details'
            : 'Score overlay'
        }
        onClick={() => {
          if (!hasScore) return;
          setIsExpanded((v) => !v);
        }}
        onMouseEnter={() => setIsPeeked(true)}
        onMouseLeave={() => setIsPeeked(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        title={hasScore ? 'Click to expand details' : 'Start typing to see your score'}
      >
        <div className={`xas-scoreRing ${scorePulse ? 'score-updated' : ''}`}>
          {hasScore ? score.grade : '•'}
          <span className="xas-srOnly">{gradeLabel}</span>
        </div>

        {(expanded || peek || !hasScore) && (
          <div className="xas-headerText">
            <div className="xas-titleRow">
              <div className="xas-title">{cardTitle}</div>
            </div>
            <div className="xas-subtitle">
              {isBelowTarget ? `Below your target (${minScoreAlert})` : gradeLabel}
            </div>
            {peek && topSuggestion && (
              <div className="xas-peekLine">{topSuggestion.message}</div>
            )}
          </div>
        )}
      </button>

      {/* Expanded View */}
      {expanded && score && (
        <>
          {/* Tabs */}
          <div className="xas-tabs" role="tablist" aria-label="Score details tabs">
            {(showSuggestions ? (['suggestions', 'breakdown', 'factors'] as const) : (['breakdown', 'factors'] as const)).map((tab, idx, arr) => (
              <button
                key={tab}
                id={`${tabsId}-tab-${tab}`}
                className="xas-tab"
                role="tab"
                type="button"
                aria-selected={activeTab === tab}
                aria-controls={`${tabsId}-panel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                  e.preventDefault();
                  const dir = e.key === 'ArrowRight' ? 1 : -1;
                  const next = (idx + dir + arr.length) % arr.length;
                  setActiveTab(arr[next]);
                  // Allow React to update, then focus the newly active tab
                  queueMicrotask(() => {
                    const el = document.getElementById(`${tabsId}-tab-${arr[next]}`);
                    el?.focus();
                  });
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div id={`${tabsId}-panel`} className="xas-panel">
            {showSuggestions && activeTab === 'suggestions' && (
              <div
                id={`${tabsId}-panel-suggestions`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-tab-suggestions`}
              >
                <SuggestionsPanel suggestions={score.suggestions} />
              </div>
            )}
            {activeTab === 'breakdown' && (
              <div
                id={`${tabsId}-panel-breakdown`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-tab-breakdown`}
              >
                <BreakdownPanel breakdown={score.breakdown} />
              </div>
            )}
            {activeTab === 'factors' && (
              <div
                id={`${tabsId}-panel-factors`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-tab-factors`}
              >
                <FactorsPanel factors={score.algorithmFactors} />
              </div>
            )}
          </div>

          {/* Predicted Reach */}
          <div className="xas-footer">
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
      <div style={{ textAlign: 'center', color: 'var(--xas-muted)', fontSize: '13px', padding: '16px' }}>
        Looking good! No major issues detected.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {suggestions.slice(0, 4).map((suggestion, index) => (
        <div key={index} className="xas-cardItem" data-tone={suggestion.type}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="xas-dot" data-tone={suggestion.type} />
            <span style={{ fontWeight: 650, color: suggestion.impact === 'high' ? '#ffffff' : 'var(--xas-text)' }}>
              {suggestion.message}
            </span>
          </div>
          {suggestion.action && (
            <div style={{ fontSize: '11px', color: 'var(--xas-muted)', marginLeft: '14px' }}>
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
          className="xas-cardItem"
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
          <div style={{ fontSize: '11px', color: 'var(--xas-muted)', marginTop: '4px' }}>
            {factor.description}
          </div>
        </div>
      ))}
    </div>
  );
}
