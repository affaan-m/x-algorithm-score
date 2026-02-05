import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ScoreOverlay } from './ScoreOverlay';
import type { TweetScore } from '../../types';

afterEach(() => cleanup());

function makeScore(): TweetScore {
  return {
    overall: 85,
    grade: 'A',
    breakdown: { content: 20, media: 0, timing: 10, engagement: 15, risk: 2 },
    suggestions: [
      { type: 'positive', category: 'engagement', message: 'Add a question', impact: 'high' },
    ],
    predictedReach: { low: 100, median: 500, high: 1200, confidence: 0.7 },
    algorithmFactors: [
      {
        name: 'Reply Potential',
        description: 'Questions drive replies.',
        weight: 1,
        currentValue: 0.5,
        optimalRange: [0.6, 1.0],
        status: 'suboptimal',
      },
    ],
  };
}

describe('ScoreOverlay', () => {
  it('shows an empty/ready state when visible but no score', () => {
    render(<ScoreOverlay score={null} isVisible={true} />);
    expect(screen.getByRole('button', { name: 'Score' })).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No score yet')).toBeInTheDocument();
  });

  it('expands and collapses via Escape', () => {
    const score = makeScore();
    render(<ScoreOverlay score={score} isVisible={true} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { name: 'Score 85' }));
    expect(screen.getByText('Top recommendation')).toBeInTheDocument();

    // Collapse
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Top recommendation')).not.toBeInTheDocument();
  });

  it('can open detailed analysis', () => {
    const score = makeScore();
    render(<ScoreOverlay score={score} isVisible={true} />);

    // Expand, then open detailed view
    fireEvent.click(screen.getByRole('button', { name: 'Score 85' }));
    fireEvent.click(screen.getByRole('button', { name: 'View detailed analysis →' }));

    expect(screen.getByText('Score Breakdown')).toBeInTheDocument();
    expect(screen.getByText('All Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Predicted Reach')).toBeInTheDocument();
  });
});

