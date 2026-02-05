/**
 * X Algorithm Score - Content Script
 *
 * Injects into X.com to:
 * 1. Detect tweet composer
 * 2. Analyze draft tweet in real-time
 * 3. Display score overlay
 * 4. Provide suggestions
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ScoreOverlay } from './components/ScoreOverlay';
import { parseTweetFeatures, scoreTweet } from '../lib/scoring-engine';
import { sendRuntimeMessage } from '../lib/runtime';
import { DEFAULT_SETTINGS, type DraftTweet, type ExtensionSettings, type TweetScore } from '../types';

// Debug mode - set to false for production
const DEBUG = false;
const log = (...args: unknown[]) => DEBUG && console.log('[X Algorithm Score]', ...args);

// Selectors for X.com UI elements with fallbacks
const SELECTORS = {
  composer: '[data-testid="tweetTextarea_0"]',
  composerFallback: '[data-testid="tweetTextarea_0RichTextInputContainer"]',
  composerAlt: 'div[role="textbox"][data-testid]',
  composerContainer: '[data-testid="toolBar"]',
  postButton: '[data-testid="tweetButtonInline"]',
  postButtonAlt: '[data-testid="tweetButton"]',
  mediaInput: 'input[data-testid="fileInput"]',
  attachedMedia: '[data-testid="attachments"]',
  gifButton: '[data-testid="gifSearchButton"]',
  pollButton: '[data-testid="pollButton"]',
  replyIndicator: '[data-testid="tweet"] [data-testid="reply"]',
  // Timeline selectors
  timeline: '[data-testid="primaryColumn"]',
  tweetArticle: 'article[data-testid="tweet"]',
  tweetText: '[data-testid="tweetText"]',
  tweetCard: '[data-testid="card.wrapper"]',
  // Thread composer selectors
  threadComposer: '[data-testid^="tweetTextarea_"]',
};

/**
 * Find composer element with fallback selectors
 */
function findComposer(): HTMLElement | null {
  return (
    document.querySelector(SELECTORS.composer) ||
    document.querySelector(SELECTORS.composerFallback) ||
    document.querySelector(SELECTORS.composerAlt)
  ) as HTMLElement | null;
}

/**
 * Find all thread composer elements
 */
function findAllComposers(): HTMLElement[] {
  const composers = Array.from(document.querySelectorAll(SELECTORS.threadComposer)) as HTMLElement[];
  return composers.filter(c => c.getAttribute('role') === 'textbox');
}

/**
 * Check if we're in a thread composer (multiple textareas)
 */
function isThreadComposer(): boolean {
  return findAllComposers().length > 1;
}

// State
let currentScore: TweetScore | null = null;
let threadScores: Map<number, TweetScore | null> = new Map();
let overlayRoot: Root | null = null;
let overlayContainer: HTMLDivElement | null = null;
let debounceTimer: number | null = null;
let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;
let composerObserver: MutationObserver | null = null;
let toolbarObserver: MutationObserver | null = null;
let timelineObserver: MutationObserver | null = null;

// Timeline scoring cache
const timelineScoreCache = new WeakMap<HTMLElement, TweetScore>();
const timelineBadgeCache = new WeakSet<HTMLElement>();

function logScoreOnPost(): void {
  if (!currentSettings.analyticsEnabled) return;
  if (!currentScore) return;

  // Get the current draft to extract context
  const composer = findComposer();
  const text = composer?.textContent || '';
  
  if (text.trim().length === 0) return;

  const features = parseTweetFeatures(text);
  const { hasMedia, mediaType } = detectMedia();
  const now = Date.now();
  const tweetPreview = text.slice(0, 80) + (text.length > 80 ? '...' : '');

  void sendRuntimeMessage({
    type: 'LOG_SCORE',
    payload: {
      score: currentScore.overall,
      grade: currentScore.grade,
      predictedReach: currentScore.predictedReach,
      timestamp: now,
      hasMedia,
      mediaType,
      externalLinks: features.externalLinks,
      hashtags: features.hashtags,
      mentions: features.mentions,
      length: features.length,
      isThread: features.isThread,
      isReply: detectReply(),
      source: 'x_composer',
      status: 'posted',
      createdAt: now,
      postedAt: now,
      tweetPreview,
    },
  }).catch(() => {
    // Best-effort local logging; ignore failures
  });
}

function attachPostListener(): void {
  const postBtn = document.querySelector(SELECTORS.postButton) as HTMLElement | null;
  if (!postBtn) return;
  if ((postBtn as HTMLElement).dataset.xasPostListener === '1') return;

  (postBtn as HTMLElement).dataset.xasPostListener = '1';
  postBtn.addEventListener(
    'click',
    () => {
      logScoreOnPost();
    },
    { capture: true }
  );
}

/**
 * Create and inject the score overlay
 */
function createOverlay(): void {
  if (overlayContainer) return;

  overlayContainer = document.createElement('div');
  overlayContainer.id = 'x-algorithm-score-overlay';
  overlayContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  document.body.appendChild(overlayContainer);
  overlayRoot = createRoot(overlayContainer);
}

/**
 * Update the overlay with new score
 */
function updateOverlay(score: TweetScore | null, isVisible: boolean): void {
  if (!overlayRoot) return;

  overlayRoot.render(
    <React.StrictMode>
      <ScoreOverlay
        score={score}
        isVisible={isVisible}
        settings={{
          showSuggestions: currentSettings.showSuggestions,
          minScoreAlert: currentSettings.minScoreAlert,
          animationsEnabled: currentSettings.animationsEnabled,
        }}
      />
    </React.StrictMode>
  );
}

function shouldShowOverlay(): boolean {
  return currentSettings.enabled && currentSettings.showScoreInComposer;
}

/**
 * Detect if media is attached to the tweet
 */
function detectMedia(): { hasMedia: boolean; mediaType?: DraftTweet['mediaType']; mediaCount?: number } {
  const attachments = document.querySelector(SELECTORS.attachedMedia);

  if (!attachments) {
    return { hasMedia: false };
  }

  // Check for images
  const images = attachments.querySelectorAll('img[src*="pbs.twimg.com"]');
  if (images.length > 0) {
    return { hasMedia: true, mediaType: 'image', mediaCount: images.length };
  }

  // Check for video
  const video = attachments.querySelector('video');
  if (video) {
    return { hasMedia: true, mediaType: 'video', mediaCount: 1 };
  }

  // Check for GIF
  const gif = attachments.querySelector('[data-testid="gifPlayer"]');
  if (gif) {
    return { hasMedia: true, mediaType: 'gif', mediaCount: 1 };
  }

  return { hasMedia: false };
}

/**
 * Detect if this is a reply
 */
function detectReply(): boolean {
  return !!document.querySelector('[data-testid="tweet"]');
}

/**
 * Detect if this is a quote tweet
 */
function detectQuoteTweet(): boolean {
  return !!document.querySelector('[data-testid="quoteTweet"]');
}

/**
 * Analyze the current draft tweet or thread
 */
function analyzeDraft(text: string, composerIndex = 0): void {
  if (!shouldShowOverlay()) {
    updateOverlay(null, false);
    return;
  }

  const { hasMedia, mediaType, mediaCount } = detectMedia();
  const features = parseTweetFeatures(text);

  const composers = findAllComposers();
  const threadLength = composers.length;

  const tweet: DraftTweet = {
    text,
    hasMedia,
    mediaType,
    mediaCount,
    isThread: threadLength > 1 || features.isThread || false,
    threadLength,
    hasQuestion: features.hasQuestion || false,
    externalLinks: features.externalLinks || 0,
    hashtags: features.hashtags || 0,
    mentions: features.mentions || 0,
    length: features.length || 0,
    hasEmoji: features.hasEmoji || false,
    hasCallToAction: features.hasCallToAction || false,
    isReply: detectReply(),
    quoteTweet: detectQuoteTweet(),
  };

  // Pass userContext if available
  const score = scoreTweet(tweet, currentSettings.userContext);

  if (threadLength > 1) {
    // Store score for this specific tweet in the thread
    threadScores.set(composerIndex, score);
    
    // Update currentScore to the first tweet's score for overlay display
    currentScore = threadScores.get(0) || score;
  } else {
    currentScore = score;
    threadScores.clear();
  }

  updateOverlay(currentScore, true);
  attachPostListener();
}

/**
 * Analyze all thread composers
 */
function analyzeAllThreadComposers(): void {
  if (!shouldShowOverlay()) {
    updateOverlay(null, false);
    return;
  }

  const composers = findAllComposers();
  
  if (composers.length === 0) {
    updateOverlay(null, false);
    return;
  }

  if (composers.length === 1) {
    // Single tweet
    const text = composers[0].textContent || '';
    analyzeDraft(text, 0);
    return;
  }

  // Multiple tweets in thread
  composers.forEach((composer, index) => {
    const text = composer.textContent || '';
    if (text.trim().length > 0) {
      analyzeDraft(text, index);
    }
  });
}

/**
 * Handle input changes in the composer
 */
function handleComposerInput(event: Event): void {
  const target = event.target as HTMLElement;

  // Debounce to avoid excessive calculations
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    if (!shouldShowOverlay()) {
      updateOverlay(null, false);
      return;
    }

    // Check if this is a thread composer
    if (isThreadComposer()) {
      analyzeAllThreadComposers();
    } else {
      const text = target.textContent || '';
      if (text.trim().length > 0) {
        analyzeDraft(text, 0);
      } else {
        // Keep overlay visible while composer is open (premium UX),
        // but show an empty/ready state until the user types.
        updateOverlay(null, true);
      }
    }
  }, 150);
}

/**
 * Check if node contains or is a composer
 */
function nodeHasComposer(node: HTMLElement): HTMLElement | null {
  if (node.matches?.(SELECTORS.composer) ||
      node.matches?.(SELECTORS.composerFallback) ||
      node.matches?.(SELECTORS.composerAlt)) {
    return node;
  }
  return (
    node.querySelector(SELECTORS.composer) ||
    node.querySelector(SELECTORS.composerFallback) ||
    node.querySelector(SELECTORS.composerAlt)
  ) as HTMLElement | null;
}

/**
 * Watch for composer to appear/disappear
 */
function watchComposer(): void {
  // Clean up existing observer if any
  if (composerObserver) {
    composerObserver.disconnect();
  }

  composerObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check for added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const composer = nodeHasComposer(node);
          if (composer) {
            setupComposerListeners(composer);
          }
        }
      }

      // Check for removed nodes (composer closed)
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          const hadComposer = nodeHasComposer(node);
          if (hadComposer) {
            updateOverlay(null, false);
            // Clean up toolbar observer when composer closes
            if (toolbarObserver) {
              toolbarObserver.disconnect();
              toolbarObserver = null;
            }
          }
        }
      }
    }
  });

  composerObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check for existing composer on load
  const existingComposer = findComposer();
  if (existingComposer) {
    setupComposerListeners(existingComposer);
  }
}

/**
 * Extract tweet data from a timeline article element
 */
function extractTimelineTweet(article: HTMLElement): DraftTweet | null {
  try {
    // Extract tweet text
    const tweetTextEl = article.querySelector(SELECTORS.tweetText);
    if (!tweetTextEl) return null;
    
    const text = tweetTextEl.textContent || '';
    if (text.trim().length === 0) return null;

    // Parse features
    const features = parseTweetFeatures(text);

    // Detect media in timeline tweet
    const hasVideo = !!article.querySelector('video');
    const hasImage = !!article.querySelector('img[src*="pbs.twimg.com/media"]');
    const hasGif = !!article.querySelector('[data-testid="gifPlayer"]');

    let mediaType: DraftTweet['mediaType'] = undefined;
    let mediaCount = 0;

    if (hasVideo) {
      mediaType = 'video';
      mediaCount = 1;
    } else if (hasGif) {
      mediaType = 'gif';
      mediaCount = 1;
    } else if (hasImage) {
      mediaType = 'image';
      const images = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
      mediaCount = images.length;
    }

    const hasMedia = mediaType !== undefined;

    // Detect if it's a reply (has reply indicator)
    const isReply = !!article.querySelector('[data-testid="socialContext"]');

    // Detect if it has a quote tweet
    const quoteTweet = !!article.querySelector('[data-testid="quoteTweet"]');

    const tweet: DraftTweet = {
      text,
      hasMedia,
      mediaType,
      mediaCount,
      isThread: features.isThread || false,
      threadLength: 1,
      hasQuestion: features.hasQuestion || false,
      externalLinks: features.externalLinks || 0,
      hashtags: features.hashtags || 0,
      mentions: features.mentions || 0,
      length: features.length || 0,
      hasEmoji: features.hasEmoji || false,
      hasCallToAction: features.hasCallToAction || false,
      isReply,
      quoteTweet,
    };

    return tweet;
  } catch (error) {
    log('Error extracting timeline tweet:', error);
    return null;
  }
}

/**
 * Inject score badge into a timeline tweet article
 */
function injectTimelineBadge(article: HTMLElement, score: TweetScore): void {
  // Don't inject if already injected
  if (timelineBadgeCache.has(article)) return;
  timelineBadgeCache.add(article);

  // Find the action bar (where reply, retweet, like buttons are)
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  // Create badge container
  const badge = document.createElement('div');
  badge.className = 'xas-timeline-badge';
  badge.setAttribute('data-score', score.overall.toString());
  badge.setAttribute('data-grade', score.grade);
  badge.title = `Score: ${score.overall} (${score.grade})`;

  // Add score text
  const scoreText = document.createElement('span');
  scoreText.className = 'xas-timeline-score';
  scoreText.textContent = score.overall.toString();
  badge.appendChild(scoreText);

  // Add grade indicator
  const gradeIndicator = document.createElement('span');
  gradeIndicator.className = 'xas-timeline-grade';
  gradeIndicator.textContent = score.grade;
  badge.appendChild(gradeIndicator);

  // Insert before action bar
  actionBar.parentElement?.insertBefore(badge, actionBar);
}

/**
 * Score and badge a timeline tweet
 */
function scoreTimelineTweet(article: HTMLElement): void {
  // Check cache first
  if (timelineScoreCache.has(article)) {
    const cachedScore = timelineScoreCache.get(article);
    if (cachedScore) {
      injectTimelineBadge(article, cachedScore);
    }
    return;
  }

  // Extract and score
  const tweet = extractTimelineTweet(article);
  if (!tweet) return;

  const score = scoreTweet(tweet, currentSettings.userContext);
  
  // Cache the score
  timelineScoreCache.set(article, score);
  
  // Inject badge
  injectTimelineBadge(article, score);
}

/**
 * Watch for timeline tweets and score them
 */
function watchTimeline(): void {
  if (!currentSettings.enabled || !currentSettings.showScoreOnTimeline) {
    return;
  }

  // Find existing tweets
  const existingTweets = document.querySelectorAll(SELECTORS.tweetArticle);
  existingTweets.forEach((article) => {
    if (article instanceof HTMLElement) {
      scoreTimelineTweet(article);
    }
  });

  // Clean up existing observer
  if (timelineObserver) {
    timelineObserver.disconnect();
  }

  // Watch for new tweets
  timelineObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check if the node is a tweet article
          if (node.matches?.(SELECTORS.tweetArticle)) {
            scoreTimelineTweet(node);
          }
          // Or check if it contains tweet articles
          const tweets = node.querySelectorAll(SELECTORS.tweetArticle);
          tweets.forEach((article) => {
            if (article instanceof HTMLElement) {
              scoreTimelineTweet(article);
            }
          });
        }
      }
    }
  });

  // Observe the timeline
  const timeline = document.querySelector(SELECTORS.timeline);
  if (timeline) {
    timelineObserver.observe(timeline, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Cleanup function for when extension is unloaded
 */
function cleanup(): void {
  if (composerObserver) {
    composerObserver.disconnect();
    composerObserver = null;
  }
  if (toolbarObserver) {
    toolbarObserver.disconnect();
    toolbarObserver = null;
  }
  if (timelineObserver) {
    timelineObserver.disconnect();
    timelineObserver = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (overlayRoot) {
    overlayRoot.unmount();
    overlayRoot = null;
  }
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
}

/**
 * Set up event listeners on composer(s)
 */
function setupComposerListeners(composer: HTMLElement): void {
  log('Setting up composer listeners');

  // Send composer detected message for onboarding
  void sendRuntimeMessage({ type: 'COMPOSER_DETECTED' }).catch(() => {
    // Best-effort; ignore failures
  });

  // Find all composers (for thread support)
  const composers = findAllComposers();

  // Set up listeners for all composers
  composers.forEach((c) => {
    // Remove any existing listeners
    c.removeEventListener('input', handleComposerInput);
    
    // Add new listener
    c.addEventListener('input', handleComposerInput);
  });

  // Initial analysis
  if (isThreadComposer()) {
    analyzeAllThreadComposers();
  } else {
    const text = composer.textContent || '';
    if (text.trim().length > 0) {
      analyzeDraft(text, 0);
    } else {
      updateOverlay(null, shouldShowOverlay());
      attachPostListener();
    }
  }

  // Clean up existing toolbar observer
  if (toolbarObserver) {
    toolbarObserver.disconnect();
  }

  // Watch for media changes and new composers being added/removed
  toolbarObserver = new MutationObserver(() => {
    if (isThreadComposer()) {
      analyzeAllThreadComposers();
    } else {
      const text = composer.textContent || '';
      if (text.trim().length > 0) {
        analyzeDraft(text, 0);
      } else {
        updateOverlay(null, shouldShowOverlay());
      }
    }
    attachPostListener();
  });

  const toolbar = composer.closest('[data-testid="toolBar"]')?.parentElement;
  if (toolbar) {
    toolbarObserver.observe(toolbar, {
      childList: true,
      subtree: true,
    });
  }
}

/**
 * Initialize the extension
 */
function init(): void {
  log('Initializing...');

  // Check if we're on X.com
  if (!window.location.hostname.includes('twitter.com') &&
      !window.location.hostname.includes('x.com')) {
    log('Not on X.com, skipping');
    return;
  }

  createOverlay();

  // Load settings once; keep updated via storage change events
  sendRuntimeMessage({ type: 'GET_SETTINGS' })
    .then((settings) => {
      currentSettings = settings;
      watchComposer();
      watchTimeline();
    })
    .catch(() => {
      currentSettings = DEFAULT_SETTINGS;
      watchComposer();
      watchTimeline();
    });

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      const next = changes.settings?.newValue as ExtensionSettings | undefined;
      if (next) {
        const prevSettings = currentSettings;
        currentSettings = next;
        // If user disables overlay while it is visible, hide it.
        if (!shouldShowOverlay()) {
          updateOverlay(null, false);
        }
        // If timeline scoring setting changed, restart timeline watching
        if (prevSettings.showScoreOnTimeline !== next.showScoreOnTimeline) {
          if (timelineObserver) {
            timelineObserver.disconnect();
            timelineObserver = null;
          }
          watchTimeline();
        }
      }
    });
  }

  // Listen for page unload to cleanup
  window.addEventListener('beforeunload', cleanup);

  log('Ready!');
}

/**
 * Export onExecute for CRXJS loader
 * This is called by the CRXJS-generated loader script
 */
export function onExecute() {
  log('onExecute called');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Also self-execute as fallback (for when loaded as regular script)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Small delay to ensure DOM is ready
  setTimeout(init, 0);
}
