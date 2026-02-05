# Changelog

All notable changes to X Algorithm Score will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-06

### Added
- **Timeline Tweet Scoring**: Display algorithm scores on existing tweets in your timeline
  - Real-time scoring as tweets load
  - Color-coded grade badges (S/A/B/C/D/F)
  - Cached scores to prevent re-scoring
  - Toggle on/off in Settings
- **Enhanced Score History**: Comprehensive history tracking and management
  - Richer entry data (media type, links, hashtags, etc.)
  - Full History tab with detailed entries
  - Export to CSV for external analysis
  - Clear all history option
  - Score trend tracking
- **User Context Integration**: Personalized scoring based on your account
  - Manual input for follower/following counts
  - Engagement rate tracking
  - Account age consideration
  - Premium/verified status
  - Adjusts link penalties and reach predictions based on context
- **Thread Composer Support**: Score multiple tweets in a thread simultaneously
  - Detects all composer boxes (tweetTextarea_0, _1, _2, etc.)
  - Scores each tweet independently
  - Accounts for thread length in scoring
  - Real-time updates as you type across all boxes
- **Optimal Posting Time Suggestions**: Smart timing recommendations
  - Analyzes current time vs peak engagement windows
  - EST timezone-based suggestions (9am-12pm, 7pm-10pm)
  - Weekday vs weekend considerations
  - Integrated into suggestion system
- **Analytics Dashboard**: Visual insights into your tweet performance
  - Total tweets scored and average score
  - Grade distribution chart with color-coded bars
  - Score trend sparkline (last 20 tweets)
  - Recent trend indicator (+/- from older tweets)
  - Predicted reach averages
  - Content insights (media usage, links, threads, replies)
- **A/B Testing Variant Generator**: Create and compare tweet alternatives
  - Generates 2-3 strategic variants automatically
  - Scoring comparison with original
  - Different strategies: hooks, CTAs, questions, thread format
  - Copy to clipboard for easy testing
  - Shows score improvements/decrements
  - Explains changes made to each variant

### Changed
- **Settings UI**: Added new sections for user context and timeline scoring
- **Popup Navigation**: Added Dashboard and History tabs (4 tabs total now)
- **Score Calculation**: Now accepts optional UserContext parameter
- **Message Types**: Extended runtime messages for CLEAR_HISTORY and EXPORT_HISTORY

### Improved
- **Performance**: Timeline scoring uses WeakMap caching for efficiency
- **Type Safety**: Enhanced TypeScript types for new features
- **UX**: Collapsible sections for variants and insights to reduce clutter

## [0.2.0] - 2026-02-05

### Added
- **Onboarding Checklist**: New 3-step activation flow for first-time users
  - Auto-detects extension loaded state
  - Guides users to pin extension and open composer
  - Persists completion state across sessions
- **Diagnostics Panel**: Troubleshooting panel in Settings tab
  - Checks if user is on x.com
  - Detects if tweet composer is open
  - Verifies extension is enabled
  - Provides actionable fix buttons for each issue
- **AI Privacy Consent Modal**: Required consent before first AI analysis
  - Explains data flow to Anthropic API
  - Stores consent flag locally
  - Can be revoked in Settings
- **Privacy & Data Section**: New section in Settings tab
  - View/clear score history
  - Revoke AI consent
  - Reset all extension data
- **API Key Validation**: Validates Claude API key format before saving
- **Reduced Motion Support**: Respects `prefers-reduced-motion` preference
- **Keyboard Navigation**: Full keyboard support for popup and overlay
  - Tab navigation through popup tabs
  - Escape to collapse expanded overlay
  - ARIA attributes for screen readers
- **Animations Toggle**: New setting to disable animations
- **Better Error Messages**: Contextual error messages throughout
- **Comprehensive Test Suite**: Unit tests for core components
  - OnboardingChecklist tests
  - DiagnosticsPanel tests
  - consent-guard tests
  - scoring-engine tests
  - diagnostics tests

### Changed
- **Settings Migration**: Automatic migration of settings on extension update
  - Active users (with score history) skip onboarding
  - New fields added with sensible defaults
- **Observer Cleanup**: Proper cleanup of MutationObservers to prevent memory leaks
- **Composer Detection**: Added fallback selectors for improved reliability
- **Debug Logging**: Console logs now conditional on DEBUG flag (disabled in production)

### Fixed
- **Tabs Logic**: Fixed inverted condition that showed tabs instead of onboarding
- **Consent Flow**: Fixed potential race condition in consent event handling
- **Runtime Message Types**: Fixed COMPOSER_DETECTED response type

### Security
- **Consent Guard Pattern**: Replaced window event-based consent with secure ref-based callbacks
- **API Key Validation**: Validates key format before storage

### Removed
- **HoverPeek Component**: Removed unused hover preview feature (dead code)

## [0.1.0] - 2026-02-04

### Added
- Initial MVP release
- Real-time tweet scoring based on X algorithm factors
- Score overlay in tweet composer
- Popup with Test, Learn, and Settings tabs
- Local scoring engine (no external API required)
- Optional AI analysis with user-provided Claude API key
- Chrome Manifest V3 support
- Privacy-first design (all data stored locally)
