/**
 * X Algorithm Score Types
 * Based on analysis of twitter/the-algorithm repository
 */

export interface DraftTweet {
  text: string;
  hasMedia: boolean;
  mediaType?: 'image' | 'video' | 'gif' | 'poll';
  mediaCount?: number;
  isThread: boolean;
  threadLength?: number;
  hasQuestion: boolean;
  externalLinks: number;
  hashtags: number;
  mentions: number;
  length: number;
  hasEmoji: boolean;
  hasCallToAction: boolean;
  isReply: boolean;
  quoteTweet: boolean;
}

export interface UserContext {
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  isPremium: boolean;           // CRITICAL: Premium affects link penalties dramatically
  accountAgeMonths: number;
  avgEngagementRate: number;
  tweepCredScore?: number;      // 0-100, below 65 = only 3 tweets distributed
  followerTimezones?: Record<string, number>;
  topicClusters?: string[];
  recentPostFrequency: number;  // posts per day
}

export interface ScoreBreakdown {
  content: number;        // Text quality, length, structure (0-25)
  media: number;          // Images, videos, polls (0-20)
  timing: number;         // Posting time optimization (0-15)
  engagement: number;     // Reply-bait, questions, CTAs (0-20)
  risk: number;           // Links, hashtags, templates, sentiment (0-30 penalty)
}

export interface TweetScore {
  overall: number;        // 0-100
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ScoreBreakdown;
  suggestions: Suggestion[];
  predictedReach: ReachPrediction;
  algorithmFactors: AlgorithmFactor[];
}

export interface Suggestion {
  type: 'positive' | 'negative' | 'neutral';
  category: keyof ScoreBreakdown;
  message: string;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

export interface ReachPrediction {
  low: number;
  median: number;
  high: number;
  confidence: number;
}

export interface AlgorithmFactor {
  name: string;
  description: string;
  weight: number;
  currentValue: number;
  optimalRange: [number, number];
  status: 'optimal' | 'suboptimal' | 'harmful';
}

/**
 * Scoring weights derived from twitter/the-algorithm home-mixer
 * ModelWeights configuration
 *
 * ACTUAL MULTIPLIERS FROM ALGORITHM CODE (2026):
 * - Reply-to-reply: 75x baseline
 * - Direct replies: 13.5-27x baseline
 * - Quote tweets: Higher than retweets
 * - Retweets: 1-2x baseline
 * - Likes: 0.5x baseline (LOWEST)
 * - Reports: -369x (devastating)
 * - Blocks/mutes: -74x
 */
export interface ScoringWeights {
  // Positive engagement signals (actual multipliers from algorithm)
  replyToReply: number;   // 75x! Conversation is king
  reply: number;          // 13.5-27x - conversation signals
  quoteTweet: number;     // Higher than retweets
  retweet: number;        // 1-2x baseline
  like: number;           // 0.5x - lowest value
  bookmark: number;       // High intent signal
  share: number;          // External amplification
  goodClick: number;      // Quality engagement
  dwellTime: number;      // >3 seconds = quality signal
  videoPlayback50: number;// Video completion critical

  // Negative signals (catastrophic multipliers)
  report: number;         // -369x
  blockMute: number;      // -74x
  negativeFeedback: number;
  weakNegative: number;
  strongNegative: number;

  // Content factors
  nativeVideoBoost: number;  // 10x engagement vs text
  mediaBoost: number;
  threadBoost: number;
  questionBoost: number;
  externalLinkPenalty: number;
  externalLinkPenaltyNonPremium: number;  // ZERO engagement
  hashtagPenalty: number;
  mentionPenalty: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  // Positive signals (normalized, reflecting actual multipliers)
  replyToReply: 1.0,     // 75x - highest possible
  reply: 0.9,            // 13-27x
  quoteTweet: 0.7,       // Higher than retweets
  retweet: 0.5,          // 1-2x baseline
  like: 0.25,            // 0.5x - lowest engagement value
  bookmark: 0.8,         // High intent
  share: 0.6,            // Valuable
  goodClick: 0.5,        // Interest signal
  dwellTime: 0.6,        // >3 sec critical
  videoPlayback50: 0.7,  // Video completion matters

  // Negative signals (normalized catastrophic penalties)
  report: -5.0,          // -369x actual = devastating
  blockMute: -3.0,       // -74x actual
  negativeFeedback: -1.0,
  weakNegative: -0.3,
  strongNegative: -0.8,

  // Content factors
  nativeVideoBoost: 20,  // 10x engagement
  mediaBoost: 15,        // Images/gifs
  threadBoost: 10,       // Dwell time increase
  questionBoost: 10,     // Drives replies (13-27x value)
  externalLinkPenalty: -15, // Premium penalty
  externalLinkPenaltyNonPremium: -25, // Essentially invisible
  hashtagPenalty: -3,    // Per hashtag over 2
  mentionPenalty: -2,    // Per mention over 3
};

export interface AnalyzedTweet {
  tweetId: string;
  authorId: string;
  score: TweetScore;
  analyzedAt: Date;
  actualMetrics?: ActualMetrics;
}

export interface ActualMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  bookmarks: number;
  impressions: number;
  recordedAt: Date;
}

export interface ExtensionSettings {
  enabled: boolean;
  showScoreInComposer: boolean;
  showScoreOnTimeline: boolean;
  showSuggestions: boolean;
  minScoreAlert: number;
  darkMode: 'auto' | 'light' | 'dark';
  analyticsEnabled: boolean;
  onboardingCompleted?: boolean;
  aiConsentAccepted?: boolean;
  animationsEnabled?: boolean;
  userContext?: UserContext;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  showScoreInComposer: true,
  showScoreOnTimeline: false,
  showSuggestions: true,
  minScoreAlert: 50,
  darkMode: 'auto',
  analyticsEnabled: false,
  onboardingCompleted: false,
  aiConsentAccepted: false,
  animationsEnabled: true,
};

export * from './runtime';
