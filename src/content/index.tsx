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
import type { DraftTweet, TweetScore } from '../types';

// Selectors for X.com UI elements
const SELECTORS = {
  composer: '[data-testid="tweetTextarea_0"]',
  composerContainer: '[data-testid="toolBar"]',
  postButton: '[data-testid="tweetButtonInline"]',
  mediaInput: 'input[data-testid="fileInput"]',
  attachedMedia: '[data-testid="attachments"]',
  gifButton: '[data-testid="gifSearchButton"]',
  pollButton: '[data-testid="pollButton"]',
  replyIndicator: '[data-testid="tweet"] [data-testid="reply"]',
};

// State
let currentScore: TweetScore | null = null;
let overlayRoot: Root | null = null;
let overlayContainer: HTMLDivElement | null = null;
let debounceTimer: number | null = null;

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
      <ScoreOverlay score={score} isVisible={isVisible} />
    </React.StrictMode>
  );
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
 * Detect thread length by counting composer textareas
 * X uses tweetTextarea_0, tweetTextarea_1, etc. for thread tweets
 */
function detectThreadLength(): number {
  const textareas = document.querySelectorAll('[data-testid^="tweetTextarea_"]');
  return Math.max(1, textareas.length);
}

/**
 * Analyze the current draft tweet
 */
function analyzeDraft(text: string): void {
  const { hasMedia, mediaType, mediaCount } = detectMedia();
  const features = parseTweetFeatures(text);

  const tweet: DraftTweet = {
    text,
    hasMedia,
    mediaType,
    mediaCount,
    isThread: features.isThread || false,
    threadLength: detectThreadLength(),
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

  currentScore = scoreTweet(tweet);
  updateOverlay(currentScore, true);
}

/**
 * Handle input changes in the composer
 */
function handleComposerInput(event: Event): void {
  const target = event.target as HTMLElement;
  const text = target.textContent || '';

  // Debounce to avoid excessive calculations
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    if (text.trim().length > 0) {
      analyzeDraft(text);
    } else {
      updateOverlay(null, false);
    }
  }, 150);
}

/**
 * Watch for composer to appear/disappear
 */
function watchComposer(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check for added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          const composer = node.querySelector(SELECTORS.composer) ||
            (node.matches(SELECTORS.composer) ? node : null);

          if (composer) {
            setupComposerListeners(composer as HTMLElement);
          }
        }
      }

      // Check for removed nodes (composer closed)
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          const hadComposer = node.querySelector(SELECTORS.composer) ||
            node.matches(SELECTORS.composer);

          if (hadComposer) {
            updateOverlay(null, false);
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also check for existing composer on load
  const existingComposer = document.querySelector(SELECTORS.composer);
  if (existingComposer) {
    setupComposerListeners(existingComposer as HTMLElement);
  }
}

/**
 * Set up event listeners on the composer
 */
function setupComposerListeners(composer: HTMLElement): void {
  // Remove any existing listeners
  composer.removeEventListener('input', handleComposerInput);

  // Add new listener
  composer.addEventListener('input', handleComposerInput);

  // Initial analysis if there's already text
  const text = composer.textContent || '';
  if (text.trim().length > 0) {
    analyzeDraft(text);
  }

  // Watch for media changes
  const toolbarObserver = new MutationObserver(() => {
    const text = composer.textContent || '';
    if (text.trim().length > 0) {
      analyzeDraft(text);
    }
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
  console.log('[X Algorithm Score] Initializing...');

  // Check if we're on X.com
  if (!window.location.hostname.includes('twitter.com') &&
      !window.location.hostname.includes('x.com')) {
    console.log('[X Algorithm Score] Not on X.com, skipping');
    return;
  }

  createOverlay();
  watchComposer();

  console.log('[X Algorithm Score] Ready!');
}

/**
 * Export onExecute for CRXJS loader
 * This is called by the CRXJS-generated loader script
 */
export function onExecute() {
  console.log('[X Algorithm Score] onExecute called');
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
