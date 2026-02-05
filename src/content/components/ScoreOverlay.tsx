import { useEffect, useState } from 'react';
import type { TweetScore, Suggestion, ExtensionSettings } from '../../types';
import { getScoreSummary, getTopRecommendation, getScoreDotColor, getScoreLabel } from '../../lib/copy-helpers';

interface ScoreOverlayProps {
  score: TweetScore | null;
  isVisible: boolean;
  settings?: Pick<ExtensionSettings, 'showSuggestions' | 'minScoreAlert' | 'animationsEnabled'>;
}

export function ScoreOverlay({ score, isVisible, settings }: ScoreOverlayProps): JSX.Element | null {
  const [view, setView] = useState<'collapsed' | 'expanded' | 'detailed'>('collapsed');
  const [isPeeked, setIsPeeked] = useState(false);
  const [scorePulse, setScorePulse] = useState(false);

  if (!isVisible) {
    return null;
  }

  const hasScore = !!score;
  const dotColor = getScoreDotColor(score?.overall ?? null);
  const summary = getScoreSummary(score);
  const topRecommendation = getTopRecommendation(score);
  const animationsEnabled = settings?.animationsEnabled ?? true;

  // Auto-collapse if score disappears
  useEffect(() => {
    if (!score) {
      setView('collapsed');
    }
  }, [score]);

  // Pulse when score changes
  useEffect(() => {
    if (!score) return;
    if (!animationsEnabled) return;
    setScorePulse(true);
    const t = window.setTimeout(() => setScorePulse(false), 320);
    return () => window.clearTimeout(t);
  }, [score?.overall, animationsEnabled]);

  // Escape to collapse
  useEffect(() => {
    if (view === 'collapsed') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setView('collapsed');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view]);

  const showPeek = view === 'collapsed' && isPeeked && hasScore;
  const showExpanded = view === 'expanded' && hasScore;
  const showDetailed = view === 'detailed' && hasScore;

  return (
    <div
      className="xas-badge"
      data-view={view}
      data-peek={showPeek}
    >
      {/* Screen reader announcement */}
      <div className="xas-srOnly" aria-live="polite" aria-atomic="true">
        {getScoreLabel(score)}
      </div>

      {/* Main badge button */}
      <button
        type="button"
        className="xas-badgeBtn"
        onClick={() => {
          if (!hasScore) return;
          setView(view === 'collapsed' ? 'expanded' : 'collapsed');
        }}
        onMouseEnter={() => setIsPeeked(true)}
        onMouseLeave={() => setIsPeeked(false)}
        aria-label={hasScore ? `Score ${score.overall}` : 'Score'}
      >
        <div className="xas-badgeContent">
          {/* Score indicator */}
          <div className="xas-scoreIndicator">
            <span className={`xas-scoreNum ${scorePulse ? 'score-updated' : ''}`}>
              {hasScore ? score.overall : '—'}
            </span>
            <span 
              className="xas-scoreDot" 
              style={{ backgroundColor: dotColor }}
            />
          </div>
        </div>

        {/* Peek summary */}
        {showPeek && (
          <div className="xas-peekSummary">
            {summary}
          </div>
        )}
      </button>

      {/* Expanded view - summary + top recommendation */}
      {showExpanded && (
        <div className="xas-expandedContent">
          <div className="xas-summary">{summary}</div>
          
          {topRecommendation && (
            <div className="xas-recommendation">
              <div className="xas-recLabel">Top recommendation</div>
              <div className="xas-recText">{topRecommendation}</div>
            </div>
          )}

          <button
            type="button"
            className="xas-detailsLink"
            onClick={(e) => {
              e.stopPropagation();
              setView('detailed');
            }}
          >
            View detailed analysis →
          </button>
        </div>
      )}

      {/* Detailed view - full breakdown */}
      {showDetailed && score && (
        <div className="xas-detailedContent">
          <div className="xas-detailedHeader">
            <button
              type="button"
              className="xas-backBtn"
              onClick={(e) => {
                e.stopPropagation();
                setView('expanded');
              }}
            >
              ← Back
            </button>
          </div>

          <div className="xas-detailedScroll">
            {/* Breakdown */}
            <div className="xas-section">
              <div className="xas-sectionTitle">Score Breakdown</div>
              <BreakdownPanel breakdown={score.breakdown} />
            </div>

            {/* All suggestions */}
            {score.suggestions.length > 0 && (
              <div className="xas-section">
                <div className="xas-sectionTitle">All Recommendations</div>
                <SuggestionsPanel suggestions={score.suggestions} />
              </div>
            )}

            {/* Predicted reach */}
            <div className="xas-section">
              <div className="xas-sectionTitle">Predicted Reach</div>
              <div className="xas-reachText">
                {score.predictedReach.low.toLocaleString()} - {score.predictedReach.high.toLocaleString()} impressions
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }): JSX.Element {
  if (suggestions.length === 0) {
    return (
      <div className="xas-emptyState">
        All signals optimized
      </div>
    );
  }

  return (
    <div className="xas-suggestionsList">
      {suggestions.map((suggestion, index) => (
        <div key={index} className="xas-suggestionItem">
          • {suggestion.message}
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
    <div className="xas-breakdownList">
      {items.map((item) => (
        <div key={item.label} className="xas-breakdownItem">
          <span className="xas-breakdownLabel">{item.label}</span>
          <span className="xas-breakdownValue">
            {item.isNegative ? item.value : `${item.value}/${item.max}`}
          </span>
        </div>
      ))}
    </div>
  );
}

