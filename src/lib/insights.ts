/**
 * X Algorithm Insights - Structured Data
 * 
 * This module provides the single source of truth for all algorithm insights
 * displayed in the extension. Each insight includes source attribution to
 * distinguish verified information from heuristics.
 */

export type InsightType = 'verified' | 'heuristic';

export interface AlgorithmInsight {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  source?: {
    name: string;
    url: string;
    lastVerified: string; // ISO date
  };
  icon: 'message-circle' | 'video' | 'link' | 'help-circle' | 'zap' | 'users' | 'filter';
}

/**
 * Verified insights traced directly to xai-org/x-algorithm open-source code
 */
export const VERIFIED_INSIGHTS: AlgorithmInsight[] = [
  {
    id: 'multi-action-prediction',
    title: 'ML Model Predicts Multiple Actions',
    description: 'The Phoenix scorer predicts probabilities for 15+ actions (like, reply, repost, click, share, block, mute, report, etc.) and combines them with configurable weights.',
    type: 'verified',
    source: {
      name: 'xai-org/x-algorithm README.md',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md',
      lastVerified: '2026-02-05',
    },
    icon: 'zap',
  },
  {
    id: 'weighted-scoring',
    title: 'Weighted Score Combination',
    description: 'Final score = Σ(weight × P(action)). Positive actions (like, reply, share) have positive weights; negative actions (block, mute, report) have negative weights.',
    type: 'verified',
    source: {
      name: 'weighted_scorer.rs',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs',
      lastVerified: '2026-02-05',
    },
    icon: 'zap',
  },
  {
    id: 'video-duration-gating',
    title: 'Video Duration Threshold Exists',
    description: 'Videos must exceed MIN_VIDEO_DURATION_MS to receive VQV (video quality view) weight. Actual weight values are not public.',
    type: 'verified',
    source: {
      name: 'weighted_scorer.rs (vqv_weight_eligibility)',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs',
      lastVerified: '2026-02-05',
    },
    icon: 'video',
  },
  {
    id: 'author-diversity',
    title: 'Author Diversity Scoring',
    description: 'Repeated posts from the same author within a feed get exponentially decaying scores: (1 - floor) × decay^position + floor. Ensures feed diversity.',
    type: 'verified',
    source: {
      name: 'author_diversity_scorer.rs',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/author_diversity_scorer.rs',
      lastVerified: '2026-02-05',
    },
    icon: 'users',
  },
  {
    id: 'oon-penalty',
    title: 'Out-of-Network Posts Downweighted',
    description: 'Posts from accounts you don\'t follow (out-of-network) are multiplied by OON_WEIGHT_FACTOR < 1.0, prioritizing in-network content.',
    type: 'verified',
    source: {
      name: 'oon_scorer.rs',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/oon_scorer.rs',
      lastVerified: '2026-02-05',
    },
    icon: 'filter',
  },
  {
    id: 'candidate-isolation',
    title: 'Candidate Isolation in Ranking',
    description: 'During transformer inference, candidates cannot attend to each other—only to your engagement history. This makes scores consistent and cacheable.',
    type: 'verified',
    source: {
      name: 'xai-org/x-algorithm README.md (Key Design Decisions)',
      url: 'https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md',
      lastVerified: '2026-02-05',
    },
    icon: 'zap',
  },
];

/**
 * Heuristic insights based on community research and best practices
 * These are NOT directly verifiable from open-source code
 */
export const HEURISTIC_INSIGHTS: AlgorithmInsight[] = [
  {
    id: 'reply-engagement-value',
    title: 'Replies > Likes for Engagement',
    description: 'Community research suggests replies drive significantly more algorithmic value than likes. Engaging with replies to your posts multiplies reach.',
    type: 'heuristic',
    icon: 'message-circle',
  },
  {
    id: 'video-engagement-boost',
    title: 'Native Video Shows Higher Engagement',
    description: 'Community testing indicates videos uploaded directly to X typically achieve higher engagement rates than text-only posts.',
    type: 'heuristic',
    icon: 'video',
  },
  {
    id: 'external-links-penalty',
    title: 'External Links May Reduce Reach',
    description: 'Community observations suggest external links, especially on non-Premium accounts, may receive lower distribution. Consider moving links to replies.',
    type: 'heuristic',
    icon: 'link',
  },
  {
    id: 'questions-drive-replies',
    title: 'Questions Encourage Engagement',
    description: 'Posts with questions tend to generate more reply engagement, which is weighted positively by the algorithm.',
    type: 'heuristic',
    icon: 'help-circle',
  },
];

/**
 * Get all insights (verified + heuristic)
 */
export function getAllInsights(): AlgorithmInsight[] {
  return [...VERIFIED_INSIGHTS, ...HEURISTIC_INSIGHTS];
}

/**
 * Get insights by type
 */
export function getInsightsByType(type: InsightType): AlgorithmInsight[] {
  return type === 'verified' ? VERIFIED_INSIGHTS : HEURISTIC_INSIGHTS;
}

/**
 * Get a single insight by ID
 */
export function getInsightById(id: string): AlgorithmInsight | undefined {
  return getAllInsights().find(insight => insight.id === id);
}
