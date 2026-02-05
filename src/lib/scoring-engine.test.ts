import { describe, expect, it } from 'vitest';
import { parseTweetFeatures, scoreTweet } from './scoring-engine';
import type { DraftTweet, UserContext } from '../types';

describe('parseTweetFeatures', () => {
  it('extracts external links, hashtags, mentions, and questions', () => {
    const text =
      'Check this out https://example.com #ai #ux @someone What do you think?';

    const f = parseTweetFeatures(text);

    expect(f.externalLinks).toBe(1);
    expect(f.hashtags).toBe(2);
    expect(f.mentions).toBe(1);
    expect(f.hasQuestion).toBe(true);
    expect(f.length).toBe(text.trim().length);
  });

  it('does not count x.com/twitter.com/t.co as external links', () => {
    const text =
      'Links: https://x.com/foo https://twitter.com/bar https://t.co/xyz';
    const f = parseTweetFeatures(text);
    expect(f.externalLinks).toBe(0);
  });
});

describe('scoreTweet (risk penalty)', () => {
  function baseTweet(partial: Partial<DraftTweet> = {}): DraftTweet {
    const text = partial.text ?? 'Hello world';
    return {
      text,
      hasMedia: false,
      isThread: false,
      hasQuestion: false,
      externalLinks: 0,
      hashtags: 0,
      mentions: 0,
      length: text.length,
      hasEmoji: false,
      hasCallToAction: false,
      isReply: false,
      quoteTweet: false,
      ...partial,
    };
  }

  it('penalizes external links more for non-Premium vs Premium', () => {
    const tweetWithLink = baseTweet({ text: 'Read https://example.com', externalLinks: 1 });

    const nonPremium: UserContext = {
      followerCount: 1000,
      followingCount: 100,
      isVerified: false,
      isPremium: false,
      accountAgeMonths: 12,
      avgEngagementRate: 0.02,
      recentPostFrequency: 1,
    };

    const premium: UserContext = { ...nonPremium, isPremium: true };

    const nonPremiumScore = scoreTweet(tweetWithLink, nonPremium);
    const premiumScore = scoreTweet(tweetWithLink, premium);

    expect(nonPremiumScore.breakdown.risk).toBeGreaterThan(premiumScore.breakdown.risk);
  });
});

