/**
 * X Algorithm Scoring Engine
 *
 * This engine provides heuristic scoring for draft tweets based on analysis of:
 * - xai-org/x-algorithm (open-source feed ranking pipeline)
 * - twitter/the-algorithm (2023 open-source release)
 * - Community research and creator best practices
 *
 * IMPORTANT: This is NOT the actual X ranking algorithm. It provides estimates
 * based on known patterns and best practices.
 *
 * === VERIFIED FROM xai-org/x-algorithm ===
 * ✓ Multi-action prediction: Model predicts P(like), P(reply), P(repost), P(click), etc.
 * ✓ Weighted combination: Final score = Σ(weight × P(action))
 * ✓ Video duration gating: Videos need minimum duration to get VQV weight
 * ✓ Author diversity: Repeated authors get exponentially decaying scores
 * ✓ Out-of-network penalty: OON posts downweighted vs in-network
 * ✓ Candidate isolation: Posts scored independently during inference
 *
 * === HEURISTIC ESTIMATES (from community research) ===
 * ⚠ Specific multiplier values (75x, 13x, etc.) are NOT in public code
 * ⚠ Link penalties, Premium effects, TweepCred thresholds are observed patterns
 * ⚠ Dwell time, timing windows, sentiment scoring are informed guesses
 * ⚠ Actual weight values (FAVORITE_WEIGHT, REPLY_WEIGHT, etc.) are not public
 *
 * See INSIGHTS_AUDIT.md for full source attribution.
 */

import {
  DraftTweet,
  UserContext,
  TweetScore,
  ScoreBreakdown,
  Suggestion,
  ReachPrediction,
  AlgorithmFactor,
  // DEFAULT_WEIGHTS will be used when implementing personalized scoring
} from '../types';

// Character count thresholds
const OPTIMAL_MIN_LENGTH = 71;
const OPTIMAL_MAX_LENGTH = 280;
const SWEET_SPOT_MIN = 120;
const SWEET_SPOT_MAX = 240;

// Algorithm-derived constants
const MAX_OPTIMAL_HASHTAGS = 2;
const MAX_OPTIMAL_MENTIONS = 3;
const THREAD_BONUS_THRESHOLD = 3;
const QUESTION_PATTERNS = /\?|what|how|why|when|where|who|which|would you|do you|have you|can you|should/i;
const CTA_PATTERNS = /follow|retweet|rt|like|share|comment|reply|click|check out|subscribe|join|dm|thread|🧵/i;

// Sentiment analysis patterns (lightweight, no ML needed)
const POSITIVE_PATTERNS = /love|great|amazing|awesome|excited|happy|thank|congrats|beautiful|incredible|fantastic|wonderful|brilliant|perfect|best|win|success|proud|grateful|blessed/i;
const NEGATIVE_PATTERNS = /hate|terrible|awful|worst|angry|frustrated|disappointed|annoying|stupid|idiotic|pathetic|trash|garbage|sucks|fail|disaster/i;

// Common template/duplicate content indicators
const TEMPLATE_PATTERNS = [
  /^gm\s*(web3|crypto|fam|everyone)?\.?$/i,  // Generic "gm" posts
  /^(day|week)\s*\d+\s*of/i,                  // "Day X of..." format
  /here's?\s*(a\s*)?thread/i,                 // Generic thread starters
  /let's?\s*talk\s*about/i,                   // Template opener
  /unpopular\s*opinion/i,                     // Overused format
  /hot\s*take/i,                              // Overused format
  /breaking:/i,                               // Fake urgency
  /🧵\s*thread\s*time/i,                      // Template thread
];

/**
 * Analyze sentiment (lightweight, pattern-based)
 * Grok AI scores tone - positive content distributed further
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveMatches = (text.match(POSITIVE_PATTERNS) || []).length;
  const negativeMatches = (text.match(NEGATIVE_PATTERNS) || []).length;

  if (negativeMatches > positiveMatches && negativeMatches > 0) {
    return 'negative';
  }
  if (positiveMatches > negativeMatches && positiveMatches > 0) {
    return 'positive';
  }
  return 'neutral';
}

/**
 * Detect template/duplicate content patterns
 * Algorithm penalizes recycled, template, and AI-generated formats
 */
function detectTemplateContent(text: string): { isTemplate: boolean; pattern?: string } {
  for (const pattern of TEMPLATE_PATTERNS) {
    if (pattern.test(text)) {
      return { isTemplate: true, pattern: pattern.source };
    }
  }
  return { isTemplate: false };
}

/**
 * Estimate TweepCred factors from observable signals
 * Real TweepCred is internal, but we can estimate based on:
 * - Follower/following ratio
 * - Account age
 * - Engagement rate
 */
export function estimateTweepCredFactors(userContext?: UserContext): {
  score: number;
  factors: { name: string; status: 'good' | 'warning' | 'bad'; tip: string }[];
} {
  if (!userContext) {
    return { score: 0.7, factors: [] }; // Assume decent if unknown
  }

  const factors: { name: string; status: 'good' | 'warning' | 'bad'; tip: string }[] = [];
  let score = 0.5; // Start at neutral

  // Follower/following ratio (spam signal)
  const ratio = userContext.followerCount / Math.max(1, userContext.followingCount);
  if (ratio > 1.5) {
    score += 0.15;
    factors.push({ name: 'Follower Ratio', status: 'good', tip: 'Healthy ratio signals authority' });
  } else if (ratio < 0.5) {
    score -= 0.1;
    factors.push({ name: 'Follower Ratio', status: 'warning', tip: 'Following more than followers can look spammy' });
  }

  // Account age
  if (userContext.accountAgeMonths > 24) {
    score += 0.1;
    factors.push({ name: 'Account Age', status: 'good', tip: 'Established accounts get more trust' });
  } else if (userContext.accountAgeMonths < 3) {
    score -= 0.1;
    factors.push({ name: 'Account Age', status: 'warning', tip: 'New accounts have limited distribution initially' });
  }

  // Engagement rate
  if (userContext.avgEngagementRate > 0.03) {
    score += 0.1;
    factors.push({ name: 'Engagement Rate', status: 'good', tip: 'High engagement signals quality content' });
  } else if (userContext.avgEngagementRate < 0.01) {
    score -= 0.05;
    factors.push({ name: 'Engagement Rate', status: 'warning', tip: 'Low engagement may affect distribution' });
  }

  // Premium status
  if (userContext.isPremium) {
    score += 0.1;
    factors.push({ name: 'Premium Status', status: 'good', tip: '2-4x visibility boost with Premium' });
  }

  return { score: Math.min(1, Math.max(0, score)), factors };
}

/**
 * Parse draft tweet text and extract features
 */
export function parseTweetFeatures(text: string): Partial<DraftTweet> {
  const cleanText = text.trim();

  // Extract URLs
  const urlPattern = /https?:\/\/[^\s]+/g;
  const urls = cleanText.match(urlPattern) || [];
  const externalLinks = urls.filter(url =>
    !url.includes('twitter.com') &&
    !url.includes('x.com') &&
    !url.includes('t.co')
  ).length;

  // Extract hashtags
  const hashtagPattern = /#\w+/g;
  const hashtags = (cleanText.match(hashtagPattern) || []).length;

  // Extract mentions
  const mentionPattern = /@\w+/g;
  const mentions = (cleanText.match(mentionPattern) || []).length;

  // Check for questions
  const hasQuestion = QUESTION_PATTERNS.test(cleanText);

  // Check for CTAs
  const hasCallToAction = CTA_PATTERNS.test(cleanText);

  // Check for emojis
  const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const hasEmoji = emojiPattern.test(cleanText);

  // Thread detection (🧵 or numbered format)
  const isThread = /🧵|1\/|1\)|thread|👇/i.test(cleanText);

  return {
    text: cleanText,
    length: cleanText.length,
    externalLinks,
    hashtags,
    mentions,
    hasQuestion,
    hasCallToAction,
    hasEmoji,
    isThread,
    hasMedia: false, // Will be set by content script
  };
}

/**
 * Calculate content score (0-25)
 */
function calculateContentScore(tweet: DraftTweet): number {
  let score = 10; // Base score

  // Length optimization
  if (tweet.length >= SWEET_SPOT_MIN && tweet.length <= SWEET_SPOT_MAX) {
    score += 8; // Sweet spot bonus
  } else if (tweet.length >= OPTIMAL_MIN_LENGTH && tweet.length <= OPTIMAL_MAX_LENGTH) {
    score += 4;
  } else if (tweet.length < OPTIMAL_MIN_LENGTH) {
    score -= 3; // Too short penalty
  }

  // Thread bonus
  if (tweet.isThread) {
    score += 3;
    if (tweet.threadLength && tweet.threadLength >= THREAD_BONUS_THRESHOLD) {
      score += 2;
    }
  }

  // Emoji adds personality (slight boost)
  if (tweet.hasEmoji) {
    score += 1;
  }

  return Math.min(25, Math.max(0, score));
}

/**
 * Calculate media score (0-20)
 * Media is HEAVILY favored by the algorithm
 */
function calculateMediaScore(tweet: DraftTweet): number {
  if (!tweet.hasMedia) return 0;

  let score = 12; // Base media boost

  switch (tweet.mediaType) {
    case 'video':
      score += 8; // Videos get highest boost
      break;
    case 'image':
      score += 5;
      // Multiple images bonus
      if (tweet.mediaCount && tweet.mediaCount > 1) {
        score += Math.min(3, tweet.mediaCount - 1);
      }
      break;
    case 'gif':
      score += 4;
      break;
    case 'poll':
      score += 6; // Polls drive engagement
      break;
  }

  return Math.min(20, score);
}

/**
 * Get optimal posting time suggestion based on current time
 */
function getOptimalPostingTimeSuggestion(): string | null {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getDay();

  // Peak engagement windows (EST timezone)
  const peakMorning = hour >= 13 && hour <= 17; // 9am-12pm EST
  const peakEvening = hour >= 23 || hour <= 3;  // 7pm-11pm EST
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (peakMorning || peakEvening) {
    return null; // Already in peak time
  }

  // Generate suggestion based on current time
  if (hour >= 4 && hour < 13) {
    // Early morning (before 9am EST)
    return 'Peak hours are 9am-12pm and 7pm-10pm (EST). Consider scheduling for later.';
  } else if (hour >= 17 && hour < 23) {
    // Afternoon gap (12pm-7pm EST)
    return 'Peak evening hours (7pm-10pm EST) are approaching. Consider waiting 1-2 hours for better reach.';
  } else if (hour >= 3 && hour < 11) {
    // Night/early morning
    return 'Post during peak hours (9am-12pm or 7pm-10pm EST) for maximum engagement.';
  }

  if (isWeekend) {
    return 'Weekdays typically see higher engagement for most content types.';
  }

  return null;
}

/**
 * Calculate timing score (0-15)
 * Based on optimal posting times and user's follower activity
 */
function calculateTimingScore(userContext?: UserContext): number {
  const now = new Date();
  const hour = now.getUTCHours();
  const dayOfWeek = now.getDay();

  let score = 8; // Base timing score

  // Peak engagement hours (adjusted for general US/EU timezones)
  // 9am-12pm and 7pm-10pm are typically best
  const peakMorning = hour >= 13 && hour <= 17; // 9am-12pm EST
  const peakEvening = hour >= 23 || hour <= 3;  // 7pm-11pm EST

  if (peakMorning || peakEvening) {
    score += 5;
  } else if (hour >= 11 && hour <= 22) {
    score += 2; // Decent hours
  }

  // Weekday vs weekend (weekdays typically better for business content)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    score += 2;
  }

  // TODO: Use userContext.followerTimezones for personalized timing
  if (userContext?.followerTimezones) {
    // Future: Calculate optimal time based on follower distribution
  }

  return Math.min(15, score);
}

/**
 * Calculate engagement potential score (0-20)
 * Questions, CTAs, and conversation starters
 */
function calculateEngagementScore(tweet: DraftTweet): number {
  let score = 5; // Base score

  // Questions are HUGE for the algorithm (drives replies)
  if (tweet.hasQuestion) {
    score += 8;
  }

  // CTAs encourage action
  if (tweet.hasCallToAction) {
    score += 4;
  }

  // Quote tweets get distributed to both audiences
  if (tweet.quoteTweet) {
    score += 3;
  }

  // Replies to popular tweets can get visibility
  if (tweet.isReply) {
    score += 2; // Slight boost, depends on parent tweet
  }

  return Math.min(20, score);
}

/**
 * Calculate risk factors (0-30 penalty)
 * External links, excessive hashtags, spam signals, templates, negative sentiment
 *
 * CRITICAL: Since March 2026, non-Premium accounts posting links
 * get ZERO median engagement. Links are essentially invisible.
 */
function calculateRiskScore(tweet: DraftTweet, isPremium: boolean = false): number {
  let penalty = 0;

  // External links are CATASTROPHICALLY penalized
  // Non-Premium: Links get 0% median engagement (essentially shadowbanned)
  // Premium: Still penalized but viable (~0.25-0.3% engagement)
  if (tweet.externalLinks > 0) {
    if (isPremium) {
      penalty += Math.min(12, tweet.externalLinks * 8);
    } else {
      // Non-premium link posts are essentially dead
      penalty += Math.min(20, tweet.externalLinks * 15);
    }
  }

  // Excessive hashtags trigger spam detection (>2 is risky)
  if (tweet.hashtags > MAX_OPTIMAL_HASHTAGS) {
    penalty += Math.min(8, (tweet.hashtags - MAX_OPTIMAL_HASHTAGS) * 3);
  }

  // Excessive mentions look spammy (>3 triggers filters)
  if (tweet.mentions > MAX_OPTIMAL_MENTIONS) {
    penalty += Math.min(6, (tweet.mentions - MAX_OPTIMAL_MENTIONS) * 2);
  }

  // Template/duplicate content detection
  const templateCheck = detectTemplateContent(tweet.text);
  if (templateCheck.isTemplate) {
    penalty += 5; // Duplicate content penalty
  }

  // Negative sentiment penalty (Grok AI scores tone)
  const sentiment = analyzeSentiment(tweet.text);
  if (sentiment === 'negative') {
    penalty += 3; // Negative tone reduces distribution
  }

  return Math.min(30, penalty);
}

/**
 * Generate actionable suggestions based on algorithm research
 */
function generateSuggestions(
  tweet: DraftTweet,
  breakdown: ScoreBreakdown,
  isPremium: boolean = false
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Media suggestions - Native video is 10x more engaging than text
  if (!tweet.hasMedia) {
    suggestions.push({
      type: 'positive',
      category: 'media',
      message: 'Add media to dramatically boost reach',
      impact: 'high',
      action: 'Native video gets 10x engagement vs text. Images/GIFs also help significantly.',
    });
  }

  // Link penalty warning - CRITICAL for non-Premium
  if (tweet.externalLinks > 0) {
    if (isPremium) {
      suggestions.push({
        type: 'negative',
        category: 'risk',
        message: 'External links reduce reach (even with Premium)',
        impact: 'high',
        action: 'Move link to first reply for better distribution of main tweet',
      });
    } else {
      suggestions.push({
        type: 'negative',
        category: 'risk',
        message: '⚠️ CRITICAL: Links get ~0% reach without Premium',
        impact: 'high',
        action: 'Non-Premium link posts are essentially invisible. Remove link or move to reply.',
      });
    }
  }

  // Question suggestion - Replies are 13.5-27x more valuable than likes
  if (!tweet.hasQuestion && breakdown.engagement < 12) {
    suggestions.push({
      type: 'positive',
      category: 'engagement',
      message: 'Add a question to encourage replies',
      impact: 'high',
      action: 'Replies are 13-27x more valuable than likes. Reply-to-reply is 75x!',
    });
  }

  // Dwell time optimization - Length helps keep users >3 seconds
  if (tweet.length < SWEET_SPOT_MIN) {
    suggestions.push({
      type: 'neutral',
      category: 'content',
      message: `Short tweets hurt dwell time (${tweet.length} chars)`,
      impact: 'medium',
      action: 'Aim for 120-240 chars. Users need to stay >3 seconds for quality signal.',
    });
  }

  // Hashtag warning - More than 2 triggers spam detection
  if (tweet.hashtags > MAX_OPTIMAL_HASHTAGS) {
    suggestions.push({
      type: 'negative',
      category: 'risk',
      message: `Too many hashtags (${tweet.hashtags}) triggers spam detection`,
      impact: 'medium',
      action: 'Use 0-1 highly relevant hashtags max. Algorithm categorizes via NLP now.',
    });
  }

  // Thread suggestion - Increases dwell time significantly
  if (tweet.length > 250 && !tweet.isThread) {
    suggestions.push({
      type: 'positive',
      category: 'content',
      message: 'Consider making this a thread',
      impact: 'medium',
      action: 'Threads increase dwell time and get you more impressions per topic.',
    });
  }

  // Engagement velocity reminder
  if (breakdown.engagement >= 10 && !tweet.hasMedia) {
    suggestions.push({
      type: 'neutral',
      category: 'engagement',
      message: 'Reply to comments within 30 min for 75x boost',
      impact: 'high',
      action: 'First 30 minutes are critical. Engage with every reply to multiply reach.',
    });
  }

  // Template/duplicate content warning
  const templateCheck = detectTemplateContent(tweet.text);
  if (templateCheck.isTemplate) {
    suggestions.push({
      type: 'negative',
      category: 'risk',
      message: 'Detected template/overused format',
      impact: 'medium',
      action: 'Algorithm penalizes recycled content. Make it more original and personal.',
    });
  }

  // Sentiment analysis
  const sentiment = analyzeSentiment(tweet.text);
  if (sentiment === 'negative') {
    suggestions.push({
      type: 'negative',
      category: 'risk',
      message: 'Negative tone detected - may reduce distribution',
      impact: 'medium',
      action: 'Grok AI scores sentiment. Positive/constructive content gets distributed further.',
    });
  } else if (sentiment === 'positive') {
    suggestions.push({
      type: 'positive',
      category: 'engagement',
      message: 'Positive tone detected - good for distribution',
      impact: 'low',
    });
  }

  // Timing optimization suggestion
  const timingSuggestion = getOptimalPostingTimeSuggestion();
  if (timingSuggestion && breakdown.timing < 12) {
    suggestions.push({
      type: 'neutral',
      category: 'timing',
      message: 'Not optimal posting time',
      impact: 'low',
      action: timingSuggestion,
    });
  }

  return suggestions;
}

/**
 * Generate algorithm factor breakdown with real multiplier info
 */
function generateAlgorithmFactors(
  _tweet: DraftTweet,
  breakdown: ScoreBreakdown
): AlgorithmFactor[] {
  return [
    {
      name: 'Reply Potential',
      description: 'Replies = 13-27x value. Reply-to-reply = 75x! Questions drive replies.',
      weight: 1.0,
      currentValue: breakdown.engagement / 20,
      optimalRange: [0.6, 1.0],
      status: breakdown.engagement >= 12 ? 'optimal' : breakdown.engagement >= 8 ? 'suboptimal' : 'harmful',
    },
    {
      name: 'Media Boost',
      description: 'Native video = 10x engagement. 4/5 sessions now include video.',
      weight: 0.8,
      currentValue: breakdown.media / 20,
      optimalRange: [0.5, 1.0],
      status: breakdown.media >= 10 ? 'optimal' : breakdown.media > 0 ? 'suboptimal' : 'harmful',
    },
    {
      name: 'Dwell Time',
      description: 'Users staying >3 seconds signals quality. Length and hooks matter.',
      weight: 0.6,
      currentValue: breakdown.content / 25,
      optimalRange: [0.5, 1.0],
      status: breakdown.content >= 15 ? 'optimal' : breakdown.content >= 10 ? 'suboptimal' : 'harmful',
    },
    {
      name: 'Platform Retention',
      description: 'External links = ~0% reach for non-Premium. Keep users on X.',
      weight: 0.95,
      currentValue: 1 - (breakdown.risk / 25),
      optimalRange: [0.8, 1.0],
      status: breakdown.risk <= 5 ? 'optimal' : breakdown.risk <= 12 ? 'suboptimal' : 'harmful',
    },
    {
      name: 'Timing & Velocity',
      description: 'First 30 minutes critical. Peak hours: 9am-12pm, 7pm-10pm EST.',
      weight: 0.5,
      currentValue: breakdown.timing / 15,
      optimalRange: [0.6, 1.0],
      status: breakdown.timing >= 10 ? 'optimal' : breakdown.timing >= 6 ? 'suboptimal' : 'harmful',
    },
  ];
}

/**
 * Calculate predicted reach based on score and user context
 */
function calculatePredictedReach(
  score: number,
  userContext?: UserContext
): ReachPrediction {
  const followerCount = userContext?.followerCount || 1000;
  // Note: engagementRate will be used in future iterations for more accurate predictions
  // const engagementRate = userContext?.avgEngagementRate || 0.02;

  // Base reach as percentage of followers
  const baseReachPercent = 0.1 + (score / 100) * 0.3; // 10-40% of followers

  const baseReach = Math.floor(followerCount * baseReachPercent);

  // Calculate range based on score variance
  const variance = 0.5 - (score / 200); // Higher scores = less variance

  return {
    low: Math.floor(baseReach * (1 - variance)),
    median: baseReach,
    high: Math.floor(baseReach * (1 + variance * 2)),
    confidence: Math.min(0.9, 0.5 + (score / 200)),
  };
}

/**
 * Convert numeric score to letter grade
 */
function scoreToGrade(score: number): TweetScore['grade'] {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Main scoring function
 * Analyzes a draft tweet and returns comprehensive score
 *
 * Premium status significantly affects link penalty calculations.
 * Non-Premium accounts with external links face near-zero distribution.
 */
export function scoreTweet(
  tweet: DraftTweet,
  userContext?: UserContext
): TweetScore {
  // Check if user has Premium (affects link penalties dramatically)
  const isPremium = userContext?.isPremium || false;

  // Calculate individual component scores
  const contentScore = calculateContentScore(tweet);
  const mediaScore = calculateMediaScore(tweet);
  const timingScore = calculateTimingScore(userContext);
  const engagementScore = calculateEngagementScore(tweet);
  const riskPenalty = calculateRiskScore(tweet, isPremium);

  const breakdown: ScoreBreakdown = {
    content: contentScore,
    media: mediaScore,
    timing: timingScore,
    engagement: engagementScore,
    risk: riskPenalty,
  };

  // Calculate overall score (max 100)
  // Max possible: 25 + 20 + 15 + 20 = 80 base, normalized to 100
  const rawScore = contentScore + mediaScore + timingScore + engagementScore - riskPenalty;
  const normalizedScore = Math.min(100, Math.max(0, Math.round(rawScore * 1.25)));

  const suggestions = generateSuggestions(tweet, breakdown, isPremium);
  const algorithmFactors = generateAlgorithmFactors(tweet, breakdown);
  const predictedReach = calculatePredictedReach(normalizedScore, userContext);

  return {
    overall: normalizedScore,
    grade: scoreToGrade(normalizedScore),
    breakdown,
    suggestions,
    predictedReach,
    algorithmFactors,
  };
}

/**
 * Quick score for real-time updates (lighter weight)
 */
export function quickScore(text: string, hasMedia: boolean = false): number {
  const features = parseTweetFeatures(text);
  const tweet: DraftTweet = {
    ...features,
    text,
    hasMedia,
    isThread: features.isThread || false,
    hasQuestion: features.hasQuestion || false,
    externalLinks: features.externalLinks || 0,
    hashtags: features.hashtags || 0,
    mentions: features.mentions || 0,
    length: features.length || 0,
    hasEmoji: features.hasEmoji || false,
    hasCallToAction: features.hasCallToAction || false,
    isReply: false,
    quoteTweet: false,
  };

  const { overall } = scoreTweet(tweet);
  return overall;
}
