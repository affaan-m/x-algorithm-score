import type { TweetScore, Suggestion } from '../types';

/**
 * Professional copy helpers for Grammarly-style overlay
 */

/**
 * Get a professional 1-2 sentence summary based on score
 */
export function getScoreSummary(score: TweetScore | null): string {
  if (!score) return 'Start typing to see your algorithm score';

  const { overall } = score;

  // 80-100: Optimal
  if (overall >= 90) return 'Exceptional engagement potential with optimal signals';
  if (overall >= 80) return 'Strong engagement potential and well-optimized';

  // 65-79: Good
  if (overall >= 70) return 'Solid foundation with room for improvement';
  if (overall >= 65) return 'Good baseline, minor refinements recommended';

  // 50-64: Fair
  if (overall >= 55) return 'Consider refining for better reach';
  if (overall >= 50) return 'Several optimizations could improve performance';

  // 35-49: Poor
  if (overall >= 40) return 'Significant improvements needed for better visibility';
  if (overall >= 35) return 'Current signals may limit reach substantially';

  // 0-34: Critical
  return 'Major revisions recommended before posting';
}

/**
 * Get the single highest-impact recommendation
 */
export function getTopRecommendation(score: TweetScore | null): string | null {
  if (!score?.suggestions?.length) return null;

  // Sort by impact and get the first high-impact suggestion
  const sorted = [...score.suggestions].sort((a, b) => {
    const weight = (impact: Suggestion['impact']) => 
      impact === 'high' ? 3 : impact === 'medium' ? 2 : 1;
    return weight(b.impact) - weight(a.impact);
  });

  const top = sorted[0];
  if (!top) return null;

  return formatRecommendation(top);
}

/**
 * Format a suggestion with clear, actionable copy
 */
export function formatRecommendation(suggestion: Suggestion): string {
  // Map suggestion types to professional, benefit-focused copy
  const message = suggestion.message.toLowerCase();
  
  // Media suggestions
  if (message.includes('media') || message.includes('image') || message.includes('video')) {
    return 'Add media for 12-20% engagement boost';
  }
  
  // Length suggestions
  if (message.includes('shorten') || message.includes('too long')) {
    return 'Shorten to 180 characters for optimal engagement';
  }
  if (message.includes('expand') || message.includes('too short')) {
    return 'Expand to 120+ characters for better performance';
  }
  
  // Link suggestions
  if (message.includes('link') && message.includes('external')) {
    return 'Remove external links to maximize reach';
  }
  
  // Hashtag suggestions
  if (message.includes('hashtag')) {
    return 'Reduce hashtags to 1-2 for better distribution';
  }
  
  // Question suggestions
  if (message.includes('question')) {
    return 'Add a question to encourage replies';
  }
  
  // Thread suggestions
  if (message.includes('thread')) {
    return 'Format as thread for higher engagement';
  }
  
  // Call-to-action suggestions
  if (message.includes('call') || message.includes('cta')) {
    return 'Add clear call-to-action for better engagement';
  }
  
  // Emoji suggestions
  if (message.includes('emoji')) {
    return 'Add 1-2 emojis for visual appeal';
  }
  
  // Mention suggestions
  if (message.includes('mention')) {
    return 'Reduce mentions to avoid spam signals';
  }
  
  // Default: use original message but clean it up
  return suggestion.message;
}

/**
 * Get the dot color for the score badge
 */
export function getScoreDotColor(score: number | null): string {
  if (score === null) return '#8899A6'; // Gray
  if (score >= 80) return '#22C55E'; // Green
  if (score >= 50) return '#EAB308'; // Yellow
  return '#EF4444'; // Red
}

/**
 * Get accessibility label for score
 */
export function getScoreLabel(score: TweetScore | null): string {
  if (!score) return 'No score yet';
  return `Score ${score.overall} out of 100`;
}
