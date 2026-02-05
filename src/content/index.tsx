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

// State
let currentScore: TweetScore | null = null;
let overlayRoot: Root | null = null;
let overlayContainer: HTMLDivElement | null = null;
let debounceTimer: number | null = null;
let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;
let composerObserver: MutationObserver | null = null;
let toolbarObserver: MutationObserver | null = null;

function logScoreOnPost(): void {
  if (!currentSettings.analyticsEnabled) return;
  if (!currentScore) return;

  void sendRuntimeMessage({
    type: 'LOG_SCORE',
    payload: {
      score: currentScore.overall,
      predictedReach: currentScore.predictedReach,
      timestamp: Date.now(),
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
 * Analyze the current draft tweet
 */
function analyzeDraft(text: string): void {
  if (!shouldShowOverlay()) {
    updateOverlay(null, false);
    return;
  }

  const { hasMedia, mediaType, mediaCount } = detectMedia();
  const features = parseTweetFeatures(text);

  const tweet: DraftTweet = {
    text,
    hasMedia,
    mediaType,
    mediaCount,
    isThread: features.isThread || false,
    threadLength: 1, // TODO: Detect thread length
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
  attachPostListener();
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
    if (!shouldShowOverlay()) {
      updateOverlay(null, false);
      return;
    }
    if (text.trim().length > 0) {
      analyzeDraft(text);
    } else {
      // Keep overlay visible while composer is open (premium UX),
      // but show an empty/ready state until the user types.
      updateOverlay(null, true);
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
 * Set up event listeners on composer
 */
function setupComposerListeners(composer: HTMLElement): void {
  log('Setting up composer listeners');

  // Send composer detected message for onboarding
  void sendRuntimeMessage({ type: 'COMPOSER_DETECTED' }).catch(() => {
    // Best-effort; ignore failures
  });

  // Remove any existing listeners
  composer.removeEventListener('input', handleComposerInput);

  // Add new listener
  composer.addEventListener('input', handleComposerInput);

  // Initial analysis if there's already text
  const text = composer.textContent || '';
  if (text.trim().length > 0) {
    analyzeDraft(text);
  } else {
    updateOverlay(null, shouldShowOverlay());
    attachPostListener();
  }

  // Clean up existing toolbar observer
  if (toolbarObserver) {
    toolbarObserver.disconnect();
  }

  // Watch for media changes
  toolbarObserver = new MutationObserver(() => {
    const text = composer.textContent || '';
    if (text.trim().length > 0) {
      analyzeDraft(text);
    } else {
      updateOverlay(null, shouldShowOverlay());
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
    })
    .catch(() => {
      currentSettings = DEFAULT_SETTINGS;
      watchComposer();
    });

  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      const next = changes.settings?.newValue as ExtensionSettings | undefined;
      if (next) {
        currentSettings = next;
        // If user disables overlay while it is visible, hide it.
        if (!shouldShowOverlay()) {
          updateOverlay(null, false);
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
