---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - path: '_bmad-output/project-context.md'
    type: 'project-context'
    loaded: true
  - path: 'README.md'
    type: 'project-doc'
    loaded: true
workflowType: 'prd'
documentCounts:
  productBriefs: 0
  researchDocuments: 0
  projectDocs: 1
  brainstormingFiles: 0
classification:
  projectType: browser_extension
  domain: productivity_creator_tools
  complexity: low_medium
  projectContext: brownfield_enhancement
---

# Product Requirements Document - X Algorithm Score Chrome Extension

**Author:** Dre
**Date:** 2026-02-05
**Version:** v0.2.0 Enhancement PRD
**Status:** Complete

---

## Executive Summary

X Algorithm Score is a Chrome Extension (Manifest V3) that provides real-time scoring of draft tweets against X's (Twitter's) open-sourced algorithm. The extension helps creators optimize their content for maximum reach through algorithmic feedback.

**Current State (v0.1.0):** Functional scoring engine, content overlay, and popup with basic settings. Core algorithm scoring works but lacks premium UX polish and onboarding.

**Enhancement Scope (v0.2.0):** Premium UI/UX improvements focused on reducing friction, improving discoverability, and building user confidence. All features are mapped to existing codebase architecture (popup `src/popup/`, content overlay `src/content/`, storage/messages `src/lib/runtime.ts`).

**Product Differentiator:** Privacy-first local scoring, algorithmically-driven feedback based on actual X algorithm multipliers, explicit user-triggered AI analysis.

---

## Success Criteria

### User Success

**Primary Success Metrics:**
- **Onboarding Completion Rate:** 80%+ of new users complete 3-step activation checklist within first session
- **Issue Reduction:** 50% reduction in "overlay not working" issues reported via GitHub issues
- **AI Adoption Rate:** 60%+ of users who see AI privacy notice accept consent and proceed with first AI analysis
- **Diagnostics Utilization:** 40%+ of users encountering issues successfully resolve them using diagnostics panel

**User Experience Success Indicators:**
- Users report feeling "confident" about how to fix overlay issues (qualitative)
- First-time setup completes in <60 seconds from installation
- Zero confusion about AI data usage before first API call

### Business Success

**Chrome Web Store Metrics:**
- **Store Approval:** Pass Chrome Web Store review on first submission
- **User Retention:** 30-day retention rate >25% (vs current baseline)
- **Rating Target:** Achieve 4.0+ star rating with 50+ reviews in first 3 months
- **Issue Resolution Rate:** 70%+ of GitHub issues resolved or marked as documentation

**Technical Success Indicators:**
- Zero store policy violations (privacy, permissions)
- Extension loads successfully on 95%+ of X.com page loads
- Local-only operations verified (no unauthorized network calls)

### Technical Success

**Performance Requirements:**
- Score overlay renders within 50ms of composer detection
- Real-time scoring updates within 150ms of user keystroke (debounced)
- Popup opens within 100ms of extension icon click
- Overlay hover peek renders within 30ms of mouse hover

**Quality Metrics:**
- 100% test coverage for new diagnostics detection logic
- All overlay detection checks are unit testable
- TypeScript strict mode compliance (no `any` types in new code)
- No new Chrome permissions required for P0/P1 features

---

## Product Scope

### MVP - v0.2.0 (This Enhancement)

**Core Deliverables:**

**P0 Features (Highest Priority):**
1. **Checklist Onboarding in Popup** - 3-step activation checklist with auto-detection (loaded ✓, pinned, composer detected)
2. **Diagnostics Mode in Settings** - "Overlay not detected" panel with ✓/✗ checks (on x.com, composer open, toggles enabled) + exact fixes
3. **Better Failure Microcopy** - Clear messages for "not on x.com", "composer not open", "overlay not detected"
4. **AI Privacy Notice** - Explicit consent modal before first AI call; store acceptance locally

**P1 Features (Premium Polish):**
1. **Overlay Hover Peek** - Top suggestion + score visible on hover before click-to-expand
2. **Score-Change Pulse** - Subtle animation when score changes; respects `prefers-reduced-motion`
3. **Full Keyboard/Focus Support** - Tab navigation across popup tabs + expanded overlay, ARIA labels, escape-to-close

**Scope Boundaries:**
- Changes limited to popup (`src/popup/`) and content overlay (`src/content/`)
- No new Chrome permissions required
- No backend changes (all local storage via `chrome.storage`)
- No algorithm scoring engine changes (`src/lib/scoring-engine.ts` remains unchanged)
- Minimal changes to background service worker (`src/background/index.ts`)

### Growth Features (Post-MVP)

**v0.3.0 Roadmap Items:**
- Score history tracking with local storage
- Timeline tweet scoring (scores on existing tweets in feed)
- User context integration (follower count, engagement rate affects predictions)
- Optimal posting time suggestions
- Multi-language support

**Future Vision (v1.0+):**
- Firefox and Safari support
- Analytics dashboard (local-only, no external tracking)
- A/B testing suggestion variants
- Custom algorithm weights for different audiences

---

## User Journeys

### Journey 1: New User First Run - Activation Success

**Opening Scene:** Sarah installs X Algorithm Score from Chrome Web Store. She clicks the extension icon, expecting to see a score overlay on her next tweet.

**Current Pain (Before Enhancement):**
- No guidance on what to do next
- Unclear if extension is working
- Doesn't know about pinning the extension
- Goes to X.com, doesn't see overlay, gets frustrated

**Rising Action:**
- Extension opens popup with clear checklist: "Get Started in 3 Steps"
- Step 1: "Extension Loaded" shows checkmark immediately (auto-detected)
- Step 2: "Pin Extension" shows "Click puzzle icon, find X Algorithm Score, click pin" with icon
- Step 3: "Test Overlay" shows "Go to x.com, click compose button"

**Climax:** Sarah follows steps, goes to X.com, clicks compose. The overlay badge appears in bottom-right corner. Score updates in real-time as she types her first tweet.

**Resolution:** Sarah posts her first optimized tweet with confidence. The extension fades into the background,默默 supporting her content creation.

**Emotional Arc:** Confusion → Clarity → Empowerment → Delight

---

### Journey 2: Troubleshooting - "Overlay Not Working"

**Opening Scene:** Mike has used the extension for a week. He opens X.com, clicks compose, but the overlay doesn't appear. He feels frustrated - "Is it broken? Did I break something?"

**Current Pain (Before Enhancement):**
- No feedback on what's wrong
- Toggles are on, overlay is off - why?
- Search issues, finds generic troubleshooting
- Gives up or reports bug

**Rising Action:**
- Mike opens popup, sees Settings tab
- "Overlay not detected" panel appears with 3 checkmarks:
  - ✓ On x.com (green check)
  - ✗ Composer not open (red X)
  - ✓ Extension enabled (green check)
- Clear microcopy: "Open a tweet composer by clicking 'Post' button"

**Climax:** Mike reads the fix, clicks Post button. Overlay appears instantly with "Great! Overlay detected" confirmation.

**Resolution:** Mike learns how the extension works. Next time overlay is missing, he knows exactly where to look.

**Emotional Arc:** Frustration → Clarity → Relief → Confidence

---

### Journey 3: AI First-Use - Privacy Conscious

**Opening Scene:** Priya wants to use AI analysis but is hesitant about data privacy. She's seen too many extensions collect data without consent.

**Current Pain (Before Enhancement):**
- No warning about what happens when clicking "Analyze with Claude"
- Unclear if tweet text is sent externally
- Worried about data collection

**Rising Action:**
- Priya opens popup, enters test text, clicks "Analyze with Claude"
- Modal appears: "AI Privacy Notice"
- Clear explanation: "Your draft text will be sent to Anthropic's API using your API key. We never see or store your data."
- Options: "I understand, continue" or "Cancel"

**Climax:** Priya reads the notice, understands the privacy model, clicks "I understand". AI analysis runs successfully.

**Resolution:** Priya stores her API key and uses AI features confidently. She trusts the extension's privacy-first approach.

**Emotional Arc:** Skepticism → Informed → Trust → Adoption

---

### Journey Requirements Summary

**Onboarding Flow Reveals:**
- Checklist UI component in popup
- Auto-detection logic for loaded state, pinned state, composer state
- State persistence (mark onboarding as completed)

**Troubleshooting Flow Reveals:**
- Diagnostics panel component in Settings tab
- Detection checks for hostname, composer DOM, storage settings
- Clear microcopy mapping each check to specific action

**AI Privacy Flow Reveals:**
- Privacy consent modal component
- Local storage of consent flag
- Guarded AI analysis function requiring consent

**Accessibility Flow Reveals:**
- Keyboard navigation across popup tabs
- Focus management in overlay
- ARIA labels for interactive elements
- Escape-to-close patterns
- `prefers-reduced-motion` support for animations

---

## Domain-Specific Requirements

### Compliance & Regulatory

**Chrome Web Store Policies:**
- **Privacy:** No data collection without explicit consent (satisfied: local-only scoring)
- **Permissions:** Only `storage` permission for user settings; no `tabs` or `activeTab` needed for content scripts
- **User-Triggered External Calls:** AI analysis must be user-triggered and documented (satisfied: button click + consent modal)
- **No Background Network Calls:** All scoring runs locally (satisfied: current implementation)

**Privacy Policy Requirements:**
- Document AI API usage: User-provided key, user-triggered, no data retention
- Document local storage: Settings, onboarding completion, AI consent flag
- Document what data is NOT collected: Tweet content, user identity, usage analytics (unless user enables analytics)

### Technical Constraints

**Extension Architecture:**
- **Manifest V3:** Service worker for background (no persistent background page)
- **Content Script Isolation:** No direct access to popup DOM; communication via `chrome.runtime.sendMessage`
- **Storage:** `chrome.storage.local` only (no `chrome.storage.sync` to avoid quota limits and privacy concerns)
- **No Cross-Origin Requests:** Content scripts cannot make network calls (AI analysis must happen in popup or service worker)

**X.com DOM Constraints:**
- **Selector Fragility:** X.com DOM changes frequently; use robust selectors with fallbacks
- **CSS Scoping:** Overlay styles must be namespaced to `#x-algorithm-score-overlay` to avoid collisions
- **Performance:** Observer-based detection must not block main thread; debounced input handling

### Integration Requirements

**Extension Contexts:**
- **Popup (`src/popup/Popup.tsx`):** Settings, diagnostics, AI consent, test mode
- **Content Script (`src/content/index.tsx`):** Composer detection, score calculation, overlay rendering
- **Background (`src/background/index.ts`):** Message routing between contexts (minimal role)
- **Shared Types (`src/types/`):** Runtime message types, storage schemas

**Storage Schema (ExtensionSettings):**
- Existing: `enabled`, `showScoreInComposer`, `showSuggestions`, `minScoreAlert`, `darkMode`, `analyticsEnabled`
- New: `onboardingCompleted`, `aiConsentAccepted`, `onboardingStep`
- New diagnostics state stored in component state, not persisted

---

## Innovation Focus

### Premium UX Patterns

**1. Contextual Onboarding**
Instead of generic "Welcome" pages, use contextual checklists that detect actual user state. The user sees progress as they complete setup steps, not just static text.

**Differentiator:** Most browser extensions have static onboarding. We use auto-detection to make setup feel dynamic and responsive.

**2. Diagnostics as First-Class Feature**
Most tools treat troubleshooting as documentation (help articles, FAQs). We make diagnostics a built-in UI component with real-time checks and actionable fixes.

**Differentiator:** Turns frustration moments into empowerment moments. Users learn how the extension works by seeing what it checks.

**3. Explicit AI Privacy**
Most extensions bury privacy policies in links. We surface privacy consent immediately before the first AI call, building trust through transparency.

**Differentiator:** Privacy-first positioning attracts security-conscious creators. No surprise data collection.

**4. Hover Peek Pattern**
Instead of requiring click-to-expand for every interaction, provide preview on hover. Users see enough information to decide if they want to engage deeper.

**Differentiator:** Reduces friction for frequent users. Power users can scan scores without expanding.

**5. Accessibility as Default**
Keyboard navigation, focus management, and `prefers-reduced-motion` are not optional features but core to the design.

**Differentiator:** Demonstrates premium quality through inclusive design. Accessible from day one.

### Implementation Innovation

**State-Driven Detection Logic**
Instead of hardcoding checks, create a reusable diagnostics framework:
- Each check is a function returning `{ passed: boolean, message: string, action: string }`
- Checks compose easily into panels
- Tests can mock each check independently

**Consent Guard Pattern**
Create a higher-order function for user-triggered actions requiring consent:
```typescript
function withConsent<T>(action: () => Promise<T>, consentKey: string): Promise<T>
```
- Wraps AI analysis call
- Checks consent flag in storage
- Shows modal if not consented
- Stores consent on user acceptance

---

## Project Type Requirements

### Browser Extension-Specific Requirements

**Content Script Injection:**
- Content script must self-inject on page load (`onExecute` export for CRXJS)
- Must detect X.com/Twitter.com hostnames before running
- Must clean up when composer closes (remove overlay, clear listeners)

**Popup Lifecycle:**
- Popup is ephemeral: state lost on close (use storage for persistence)
- Must handle edge case: user navigates to x.com, opens popup, then closes popup
- Settings changes must propagate to content script via `chrome.storage.onChanged`

**Service Worker (Manifest V3):**
- Background script is a service worker: no persistent state, no DOM access
- Must return `true` from async message handlers to keep response channel open
- Must handle `chrome.runtime.onMessage` for storage operations (popup ↔ background)

**Selector Resilience:**
- X.com uses `data-testid` attributes but they change over time
- Must maintain selector constants (`SELECTORS` object) for easy updates
- Graceful degradation: if selector fails, log error and retry with fallback

**CSS Isolation:**
- Overlay styles scoped to `#x-algorithm-score-overlay` ID
- Use `!important` sparingly to avoid X.com style conflicts
- Tailwind classes are bundled for popup, but overlay uses inline styles or scoped CSS

**Runtime Message Typing:**
- Create discriminated union for runtime messages (`RuntimeMessage` type)
- Shared across all contexts to ensure type safety
- Example: `{ type: 'GET_SETTINGS' } | { type: 'LOG_SCORE', payload: ... }`

### Chrome Web Store Requirements

**Permissions:**
- Current: `storage` (minimal)
- No new permissions for v0.2.0 (store review friendly)
- Documentation required for any future permission additions

**Privacy Policy:**
- Must document what data is collected (minimal: user settings, optional analytics)
- Must document external API usage (Anthropic Claude, user-triggered)
- Must document local storage behavior

**Manifest Structure:**
- `manifest.json` is build input (CRXJS), not source
- Must maintain compatibility with CRXJS plugin
- Icon assets must be present at specified sizes (16, 48, 128)

---

## Functional Requirements

### Onboarding and Setup

**FR1: First-time users can view a 3-step onboarding checklist when opening the extension popup**
- Actor: First-time user
- Context: Popup opens for first time; onboarding not completed
- Steps shown: "Extension Loaded" (auto-checked), "Pin Extension", "Test Overlay"

**FR2: Extension can auto-detect loaded state and mark first checklist item as complete**
- Actor: Extension (automated)
- Context: Popup initialization
- Logic: `chrome.runtime.getManifest()` returns manifest → loaded state true

**FR3: Extension can detect if user has pinned the extension**
- Actor: Extension (automated)
- Context: Onboarding step 2
- Logic: Query Chrome API for extension action state; if not pinned, show instructions with icon

**FR4: Extension can detect if composer is open on x.com and mark onboarding complete**
- Actor: Extension (automated)
- Context: User navigates to x.com and clicks compose
- Logic: Content script detects composer DOM → sends message to popup → popup marks step 3 complete

**FR5: Extension can persist onboarding completion state across popup closures**
- Actor: Extension (automated)
- Context: User completes all 3 steps
- Storage: `chrome.storage.local.set({ onboardingCompleted: true })`

**FR6: Users who have completed onboarding see the main popup tabs instead of checklist**
- Actor: Returning user
- Context: Popup opens; `onboardingCompleted === true` in storage
- UI: Show Test, Learn, Settings tabs (not checklist)

### Diagnostics and Troubleshooting

**FR7: Users can view a diagnostics panel in the Settings tab when overlay is not detected**
- Actor: User experiencing overlay issues
- Context: Overlay not visible on x.com composer
- UI: "Overlay not detected" panel in Settings with checkmark list

**FR8: Extension can check if user is on x.com/twitter.com**
- Actor: Extension (automated)
- Context: Diagnostics check 1
- Logic: `window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')`
- Pass: ✓ "On x.com"
- Fail: ✗ "Not on x.com - navigate to x.com"

**FR9: Extension can check if composer is open**
- Actor: Extension (automated)
- Context: Diagnostics check 2
- Logic: `document.querySelector('[data-testid="tweetTextarea_0"]') !== null`
- Pass: ✓ "Composer open"
- Fail: ✗ "Composer not open - click Post button"

**FR10: Extension can check if extension is enabled and show-in-composer toggle is on**
- Actor: Extension (automated)
- Context: Diagnostics check 3
- Logic: Read `ExtensionSettings.enabled` and `ExtensionSettings.showScoreInComposer` from storage
- Pass: ✓ "Extension enabled and overlay visible"
- Fail: ✗ "Extension disabled - enable in Settings"

**FR11: Diagnostics panel shows specific action message for each failed check**
- Actor: User experiencing overlay issues
- Context: Viewing diagnostics panel
- UI: Each check shows "Go to x.com", "Click Post button", or "Enable in Settings"

### Error Messaging and Microcopy

**FR12: Users see clear microcopy when overlay is not on x.com**
- Actor: User on non-X site
- Context: User opens popup or content script initializes
- Message: "X Algorithm Score only works on x.com. Please navigate to x.com to see scores."

**FR13: Users see clear microcopy when composer is not open**
- Actor: User on x.com without composer
- Context: User opens Settings or checks overlay
- Message: "No tweet composer detected. Click the 'Post' button to compose a new tweet."

**FR14: Users see clear microcopy when overlay is disabled in settings**
- Actor: User with extension disabled
- Context: User toggles off "Show score while composing"
- Message: "Overlay is disabled. Enable 'Show score while composing' in Settings to see real-time scores."

**FR15: Users see clear microcopy when overlay fails to initialize**
- Actor: User experiencing overlay initialization error
- Context: Overlay container not created or React root fails
- Message: "Overlay failed to initialize. Try refreshing the page or reloading the extension."

### AI Privacy Consent

**FR16: Users see a privacy consent modal before first AI analysis call**
- Actor: First-time AI user
- Context: User clicks "Analyze with Claude" and `aiConsentAccepted` is not set in storage
- UI: Modal with title "AI Privacy Notice", explanation, and buttons "I understand, continue" / "Cancel"

**FR17: Consent modal explains that tweet text is sent to Anthropic API using user's API key**
- Actor: First-time AI user
- Context: Viewing consent modal
- Content: "Your draft text will be sent to Anthropic's API using your API key. We never see or store your data."

**FR18: Users can accept AI privacy consent and store consent flag locally**
- Actor: First-time AI user
- Context: User clicks "I understand, continue" in modal
- Storage: `chrome.storage.local.set({ aiConsentAccepted: true })`
- Action: Proceed with AI analysis call

**FR19: Users can decline AI privacy consent and cancel analysis**
- Actor: First-time AI user
- Context: User clicks "Cancel" in modal
- Action: Close modal, do not call AI API

**FR20: Users who have accepted consent do not see modal on subsequent AI calls**
- Actor: Returning AI user
- Context: User clicks "Analyze with Claude" and `aiConsentAccepted === true` in storage
- Action: Proceed directly to AI analysis without showing modal

### Overlay Interaction and Premium Polish

**FR21: Users can hover over the collapsed overlay badge to see score and top suggestion**
- Actor: User with open composer
- Context: Overlay is collapsed (small badge in corner)
- UI: Hover triggers tooltip/peek showing score (e.g., "85 / A") and top suggestion (e.g., "Add a question to boost engagement")

**FR22: Users can click the overlay badge to expand full details**
- Actor: User with open composer
- Context: User clicks collapsed badge
- UI: Expand to show score breakdown, all suggestions, algorithm factors

**FR23: Users can click again on expanded overlay to collapse back to badge**
- Actor: User with expanded overlay
- Context: User clicks expanded overlay
- UI: Collapse to small badge; maintain position

**FR24: Overlay shows subtle pulse animation when score changes**
- Actor: User typing in composer
- Context: Score value changes from previous calculation
- UI: Badge pulses (scale/brightness) for 300ms, then settles
- Constraint: Animation respects `prefers-reduced-motion` media query

**FR25: Pulse animation is disabled for users who prefer reduced motion**
- Actor: User with `prefers-reduced-motion` system preference
- Context: Score changes
- UI: No pulse animation shown

### Keyboard and Accessibility Support

**FR26: Users can navigate between popup tabs using keyboard (Tab key)**
- Actor: Keyboard user
- Context: Popup is open with multiple tabs (Test, Learn, Settings)
- Action: Tab key cycles through tab buttons; Enter/Space activates focused tab

**FR27: Users can navigate within expanded overlay using keyboard**
- Actor: Keyboard user
- Context: Overlay is expanded
- Action: Tab key cycles through interactive elements (score, suggestions, close button)

**FR28: Users can close expanded overlay using Escape key**
- Actor: Keyboard user
- Context: Overlay is expanded and has focus
- Action: Pressing Escape collapses overlay back to badge

**FR29: Popup tabs and overlay elements have ARIA labels for screen readers**
- Actor: Screen reader user
- Context: Navigating popup or overlay
- UI: All buttons, tabs, and interactive elements have `aria-label` or `aria-labelledby`

**FR30: Overlay hover peek is accessible to keyboard users via Focus reveal**
- Actor: Keyboard user
- Context: Overlay badge is focused
- Action: Focus state shows same content as hover peek (score + top suggestion)

---

## Non-Functional Requirements

### Performance

**Overlay Responsiveness:**
- Score overlay renders within 50ms of composer DOM detection
- Real-time scoring updates within 150ms of keystroke (debounced)
- Overlay hover peek renders within 30ms of mouse hover
- Score-change pulse animation completes in 300ms

**Popup Performance:**
- Popup opens within 100ms of extension icon click
- Settings tab loads diagnostics checks within 50ms
- AI consent modal renders within 30ms of trigger

**Content Script Efficiency:**
- Debounced input handling: 150ms delay before score recalculation
- MutationObserver throttling: Do not block main thread
- Composer detection check: O(1) DOM query, not O(n) tree traversal

### Accessibility

**Keyboard Navigation:**
- All interactive elements reachable via Tab key
- Logical tab order (tabs → content → controls)
- Enter/Space activate focused elements
- Escape closes overlays and modals

**Screen Reader Support:**
- ARIA labels on all buttons and tabs
- ARIA live regions for dynamic score updates
- ARIA alerts for error messages
- Alt text or decorative labels for icons

**Visual Accessibility:**
- Color contrast ratio ≥4.5:1 for text (WCAG AA)
- Color is not the only indicator (use icons + color)
- Text scaling support (respect browser zoom)
- No seizure-inducing animations (max 3 flashes/second)

**Motion Preferences:**
- All animations respect `prefers-reduced-motion`
- Users with motion sensitivity experience no animations
- Provide option in Settings to disable animations explicitly

### Security

**Data Privacy:**
- All scoring runs locally (no server calls)
- No telemetry or analytics by default (user opt-in only)
- AI analysis uses user-provided API key (extension never stores key)
- No tracking of tweet content or user identity

**API Key Protection:**
- API keys stored in `chrome.storage.local` (encrypted at rest on OS level)
- Keys never transmitted to extension servers (only direct to Anthropic)
- User can clear key via Settings

**Chrome Extension Security:**
- Content scripts cannot access extension popup DOM (same-origin policy)
- No eval() or dynamic code execution
- No inline scripts in HTML files
- CSP (Content Security Policy) enforced in manifest

### Reliability

**Overlay Detection Robustness:**
- Graceful handling of selector failures (log error, show user message)
- Retry logic for composer detection (poll 3 times with 500ms delay)
- Cleanup on composer close (remove overlay, clear listeners)

**State Management:**
- Settings persist across popup closures via storage
- Onboarding state persists across sessions
- Diagnostics state resets on page load (not persisted)

**Error Recovery:**
- Content script crash: Service worker detects and re-injects
- Storage access failure: Fall back to DEFAULT_SETTINGS
- API key error: Show user-friendly error with "Enter API key in Settings"

---

## Acceptance Criteria

### P0 Feature: Checklist Onboarding

**AC1:** When a first-time user opens the popup, they see a 3-step checklist
- Steps: "Extension Loaded ✓", "Pin Extension", "Test Overlay"
- Step 1 is auto-checked immediately
- Steps 2 and 3 show pending state

**AC2:** When user pins the extension (via puzzle icon), step 2 auto-checks on next popup open
- Extension detects pinned state via Chrome API
- Checkmark appears next to "Pin Extension"

**AC3:** When user opens composer on x.com, step 3 auto-checks
- Content script detects composer DOM
- Sends message to popup: `{ type: 'COMPOSER_DETECTED' }`
- Popup updates checklist with checkmark

**AC4:** When all 3 steps complete, onboarding is marked complete and user sees main tabs
- Storage: `onboardingCompleted: true` saved
- Next popup open shows Test/Learn/Settings tabs (not checklist)

### P0 Feature: Diagnostics Mode

**AC5:** When overlay is not detected, Settings tab shows "Overlay not detected" panel
- Panel appears at top of Settings content
- Contains 3 checks with checkmark/X icons

**AC6:** Diagnostics checks correctly identify state
- Check 1: On x.com? → ✓ if `hostname.includes('x.com')`
- Check 2: Composer open? → ✓ if composer DOM exists
- Check 3: Extension enabled? → ✓ if storage settings show enabled

**AC7:** Each failed check shows actionable fix message
- Not on x.com: "Navigate to x.com to use overlay"
- Composer not open: "Click 'Post' button to compose tweet"
- Extension disabled: "Enable 'Show score while composing' in Settings"

**AC8:** When user fixes failed condition and re-checks diagnostics, status updates
- User navigates to x.com → Check 1 becomes ✓
- User opens composer → Check 2 becomes ✓
- User enables setting → Check 3 becomes ✓

### P0 Feature: Better Failure Microcopy

**AC9:** When user opens popup on non-X site, microcopy explains why overlay won't show
- Message: "X Algorithm Score only works on x.com. Please navigate to x.com to see scores."
- No overlay visible on non-X sites

**AC10:** When composer is closed, Settings shows clear message
- Message: "No tweet composer detected. Click the 'Post' button to compose a new tweet."
- Diagnostics panel shows Check 2 as ✗ with fix

**AC11:** When overlay is disabled in settings, microcopy explains how to enable
- Message: "Overlay is disabled. Enable 'Show score while composing' in Settings to see real-time scores."
- Toggle in Settings shows off state

### P0 Feature: AI Privacy Notice

**AC12:** When first-time user clicks AI analysis button, consent modal appears
- Title: "AI Privacy Notice"
- Body: Explains data flow to Anthropic API
- Buttons: "I understand, continue" (primary) and "Cancel" (secondary)

**AC13:** When user accepts consent, analysis proceeds and consent is stored
- Storage: `aiConsentAccepted: true` saved
- AI API call executes immediately
- Results display in popup

**AC14:** When user declines consent, modal closes and no API call is made
- No storage change
- No API call
- User remains on test tab with draft text

**AC15:** When user has already consented, clicking AI button proceeds directly to analysis
- No modal shown
- API call executes immediately
- Consented state stored persists across sessions

### P1 Feature: Overlay Hover Peek

**AC16:** When user hovers over collapsed badge, peek shows score and top suggestion
- Hover state within 30ms of mouseover
- Peek displays: Score (e.g., "85 / A") and top suggestion text
- Peek positioned above or beside badge

**AC17:** When user moves mouse away, peek disappears
- Hover-out removes peek immediately
- Badge returns to collapsed state

### P1 Feature: Score-Change Pulse

**AC18:** When score changes from previous value, badge pulses
- Animation: Scale up/down or brightness flash
- Duration: 300ms total
- Triggers: Any score value change (grade or numeric)

**AC19:** Pulse animation respects user's motion preferences
- If `prefers-reduced-motion` is true, no pulse shown
- If user disables animations in Settings, no pulse shown

### P1 Feature: Keyboard and Accessibility

**AC20:** Popup tabs are keyboard navigable
- Tab key cycles through Test, Learn, Settings tab buttons
- Focused tab has visible outline (2px solid #1DA1F2)
- Enter/Space key activates focused tab

**AC21:** Expanded overlay is keyboard accessible
- Tab key cycles through score, suggestions, algorithm factors
- Close button is last tab stop
- Escape key collapses overlay

**AC22:** Screen reader announces overlay state changes
- ARIA live region announces "Score 85, grade A" when updated
- ARIA alert announces "Overlay expanded" on click
- All buttons have descriptive aria-label or aria-labelledby

---

## Implementation Specifications

### Component Mapping to Existing Codebase

**New Components in `src/popup/`:**

1. **`OnboardingChecklist.tsx`** - Checklist UI
   - Props: `onComplete?: () => void`
   - State: `currentStep: 1 | 2 | 3`, `steps: { [key: number]: boolean }`
   - Actions: `detectLoadedState()`, `detectPinnedState()`, `detectComposerState()`

2. **`DiagnosticsPanel.tsx`** - Diagnostics UI
   - Props: `checks: DiagnosticCheck[]`
   - Type: `DiagnosticCheck = { name: string, passed: boolean, message: string, action: string }`
   - Actions: `runAllDiagnostics()`

3. **`AIConsentModal.tsx`** - Privacy consent modal
   - Props: `onAccept: () => void`, `onDecline: () => void`
   - Content: Static privacy notice text

**New Components in `src/content/components/`:**

4. **`HoverPeek.tsx`** - Hover peek for collapsed badge
   - Props: `score: TweetScore | null`, `isHovered: boolean`
   - Renders: Score badge + top suggestion tooltip

5. **`ScorePulse.tsx`** - Pulse animation wrapper
   - Props: `children: React.ReactNode`, `shouldPulse: boolean`
   - CSS: `@keyframes pulse` with `prefers-reduced-motion` query

**Modified Files:**

- **`src/popup/Popup.tsx`**:
  - Add state: `onboardingCompleted` (read from storage)
  - Conditional render: OnboardingChecklist vs Tabs
  - Add Settings tab content: DiagnosticsPanel + existing settings
  - AI analysis: Wrap `handleAIAnalysis` with consent guard

- **`src/content/components/ScoreOverlay.tsx`**:
  - Add state: `isHovered` (mouse events on badge)
  - Add `HoverPeek` component for collapsed state
  - Add `ScorePulse` wrapper around badge
  - Add keyboard handlers: `onKeyDown` (Escape to close)
  - Add ARIA attributes: `aria-expanded`, `aria-label`

- **`src/content/index.tsx`**:
  - Add detection logic for onboarding step 3: `sendRuntimeMessage({ type: 'COMPOSER_DETECTED' })`
  - Add diagnostics check helpers: `checkHostname()`, `checkComposer()`, `checkSettings()`
  - Export detection functions for use in DiagnosticsPanel

- **`src/types/index.ts`**:
  - Add to `ExtensionSettings`: `onboardingCompleted?: boolean`, `aiConsentAccepted?: boolean`
  - Add new runtime message types: `COMPOSER_DETECTED`, `RUN_DIAGNOSTICS`

- **`src/lib/runtime.ts`**:
  - Add `detectComposerState()`: Checks Chrome API for pinned state
  - Add `checkDiagnostics()`: Returns array of DiagnosticCheck results

### Storage Schema Updates

**ExtensionSettings Type (Existing + New Fields):**

```typescript
export interface ExtensionSettings {
  // Existing
  enabled: boolean;
  showScoreInComposer: boolean;
  showScoreOnTimeline: boolean;
  showSuggestions: boolean;
  minScoreAlert: number;
  darkMode: 'auto' | 'light' | 'dark';
  analyticsEnabled: boolean;

  // New for v0.2.0
  onboardingCompleted?: boolean;
  aiConsentAccepted?: boolean;
  animationsEnabled?: boolean; // Default: true
}
```

**Storage Keys:**
- `settings` - Main settings object (ExtensionSettings)
- No new storage keys needed (extend existing settings object)

### Runtime Message Types

**New Messages:**

```typescript
export type RuntimeMessage =
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_SETTINGS', payload: Partial<ExtensionSettings> }
  | { type: 'LOG_SCORE', payload: { score: number, predictedReach: ReachPrediction, timestamp: number } }
  // New for v0.2.0
  | { type: 'COMPOSER_DETECTED' } // Sent from content script to popup
  | { type: 'RUN_DIAGNOSTICS', payload: { checks: DiagnosticCheck[] } }
  | { type: 'CHECK_PINNED_STATE' } // Sent from popup to content script or background
```

### CSS Isolation Strategy

**Overlay Styles (Scoped to `#x-algorithm-score-overlay`):**

```css
#x-algorithm-score-overlay {
  /* Container styles */
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

#x-algorithm-score-overlay .badge {
  /* Collapsed badge styles */
}

#x-algorithm-score-overlay .peek {
  /* Hover peek styles */
}

#x-algorithm-score-overlay .expanded {
  /* Expanded overlay styles */
}

#x-algorithm-score-overlay .pulse {
  /* Pulse animation */
  animation: pulse 300ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  #x-algorithm-score-overlay .pulse {
    animation: none;
  }
}
```

**Popup Styles:**
- Continue using Tailwind CSS via `className` props
- Add new Tailwind classes for animations: `animate-pulse` (or custom via `tailwind.config.js`)

### Testing Strategy

**Unit Tests (Vitest):**

1. **Detection Logic Tests** (`src/content/index.test.ts`):
   - `test('detectHostname returns true for x.com')`
   - `test('detectHostname returns false for example.com')`
   - `test('detectComposer returns true when composer DOM exists')`
   - `test('detectComposer returns false when composer DOM missing')`

2. **Diagnostics Tests** (`src/popup/DiagnosticsPanel.test.tsx`):
   - `test('shows all 3 checks with correct status')`
   - `test('updates checks when conditions change')`

3. **Consent Guard Tests** (`src/lib/ai-analysis.test.ts`):
   - `test('shows modal when consent not accepted')`
   - `test('stores consent and proceeds when accepted')`
   - `test('does not call API when declined')`

**Integration Tests (Manual E2E):**

1. **Onboarding Flow:**
   - Install extension fresh
   - Open popup → see checklist
   - Pin extension → step 2 checks
   - Open composer on x.com → step 3 checks
   - Reopen popup → see tabs (not checklist)

2. **Diagnostics Flow:**
   - Open popup on non-X site → see diagnostics
   - Navigate to x.com → check 1 passes
   - Open composer → check 2 passes
   - Enable settings → check 3 passes

3. **AI Consent Flow:**
   - Click AI button → see modal
   - Click "I understand" → see analysis results
   - Click AI button again → analysis proceeds directly (no modal)

**Accessibility Tests (Keyboard + Screen Reader):**
- Tab through popup tabs → verify focus visible
- Navigate overlay with keyboard → verify order and Escape
- Use NVDA/JAWS → verify announcements

---

## Risk Mitigations

### Risk 1: X.com DOM Selector Changes Break Overlay Detection

**Probability:** High (X.com changes frequently)
**Impact:** Critical (overlay fails to detect composer)

**Mitigation:**
- Maintain selector constants in one location (`SELECTORS` object in `src/content/index.tsx`)
- Add fallback selectors for critical elements
- Log selector errors to console for debugging
- Document common selector patterns in code comments

**Fallback:**
- If primary selector fails, try alternative selectors (e.g., `class` names)
- If all selectors fail, show diagnostics error: "Composer UI changed - report issue"

### Risk 2: Chrome Web Store Rejects Extension Due to Privacy Policy

**Probability:** Medium
**Impact:** High (store rejection delays launch)

**Mitigation:**
- Update `PRIVACY_POLICY.md` with AI API usage details
- Document: "AI analysis uses your API key, user-triggered, no data retention"
- Document: "All scoring runs locally, no server calls"
- Submit policy for review before extension submission

**Fallback:**
- If store rejects, revise policy and resubmit
- Alternative: Remove AI features (but target P0 features don't depend on AI)

### Risk 3: Auto-Detection of Pinned State Not Possible via Chrome API

**Probability:** Medium
**Impact:** Medium (Onboarding step 2 can't auto-check)

**Investigation Needed:**
- Check if `chrome.action.getUserSettings()` or similar API exists
- Check if querying browser UI state is allowed

**Fallback:**
- If API not available, make step 2 manual: "I have pinned the extension" checkbox
- User clicks checkbox → manual checkmark

### Risk 4: MutationObserver Performance Impact on Large X.com Pages

**Probability:** Low (MutationObserver is efficient)
**Impact:** Medium (performance degradation on slow devices)

**Mitigation:**
- Throttle observer callbacks: Debounce by 100ms
- Disconnect observer when composer closes
- Limit subtree depth in observer config

**Fallback:**
- If performance issues reported, reduce observer frequency
- Provide option in Settings to disable auto-detection (manual trigger only)

---

## Dependencies

### External Dependencies (Existing)

- `react` ^18.2.0 - UI library
- `react-dom` ^18.2.0 - React rendering
- `lucide-react` ^0.314.0 - Icons (used for checkmarks, warnings)
- `zustand` ^4.5.0 - State management (not used in current code, but available)

### Build Dependencies

- `vite` ^5.0.12 - Build tool
- `@crxjs/vite-plugin` ^2.3.0 - Chrome extension build plugin
- `typescript` ^5.3.3 - Type checking
- `eslint` ^8.56.0 - Linting

### Development Dependencies

- `vitest` - Testing framework (add if not present)
- `@testing-library/react` - Component testing (add if not present)

### New Dependencies (None Required)

All P0/P1 features can be implemented with existing dependencies. No new npm packages needed.

---

## Chrome Web Store Submission Checklist

### Pre-Submission

- [ ] Update `manifest.json` version to `0.2.0`
- [ ] Update `package.json` version to `0.2.0`
- [ ] Run `npm run build` → verify `dist/` folder contains all assets
- [ ] Load `dist/` in Chrome (Load Unpacked) → test all P0 features manually
- [ ] Update `PRIVACY_POLICY.md` with AI API usage documentation
- [ ] Create store listing description and screenshots (or use placeholder screenshots)
- [ ] Verify permissions: Only `storage` (no new permissions)

### Store Listing

- [ ] Title: "X Algorithm Score"
- [ ] Description: "Score your tweets before posting based on X's actual recommendation algorithm. Get real-time feedback to maximize your reach."
- [ ] Screenshots: Show onboarding, diagnostics, overlay
- [ ] Privacy Policy: Link to `PRIVACY_POLICY.md` in repo
- [ ] Category: "Productivity"

### Post-Submission

- [ ] Monitor review status
- [ ] Address any policy questions from Google
- [ ] Test published version matches `dist/` build
- [ ] Set up GitHub issue template for bug reports

---

## Glossary

- **Overlay** - The floating UI element on x.com that shows tweet score and suggestions (collapsed badge or expanded panel)
- **Composer** - The tweet input area on x.com where users draft tweets
- **Badge** - The collapsed state of the overlay, showing just the score (e.g., "85 / A")
- **Pulse Animation** - Subtle scale/brightness animation that plays when score changes
- **Hover Peek** - Preview of score and top suggestion shown when mouse hovers over collapsed badge
- **Content Script** - JavaScript injected into x.com page; handles composer detection and overlay rendering
- **Popup** - Extension popup opened via extension icon; contains tabs for Test, Learn, Settings
- **Service Worker** - Background script (Manifest V3); handles message routing between contexts
- **Storage** - `chrome.storage.local` for persisting settings, onboarding state, consent flags
- **Diagnostics** - System of checks that detect why overlay isn't showing
- **Auto-Detection** - Automated checks for loaded state, pinned state, composer state

---

## Appendix

### Selector Reference

**Current X.com Selectors (v0.1.0 - verified 2026-02-05):**

```typescript
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
```

**Note:** These selectors may change in future X.com updates. Monitor for breakage and update constants accordingly.

### File Structure After v0.2.0 Enhancement

```
src/
├── background/
│   └── index.ts (unchanged - minimal role)
├── content/
│   ├── components/
│   │   ├── ScoreOverlay.tsx (modified - add hover peek, pulse, keyboard)
│   │   ├── HoverPeek.tsx (NEW)
│   │   └── ScorePulse.tsx (NEW)
│   ├── index.tsx (modified - add diagnostics helpers)
│   └── styles.css (unchanged)
├── popup/
│   ├── Popup.tsx (modified - add onboarding, diagnostics, consent guard)
│   ├── OnboardingChecklist.tsx (NEW)
│   ├── DiagnosticsPanel.tsx (NEW)
│   ├── AIConsentModal.tsx (NEW)
│   └── styles.css (unchanged - uses Tailwind)
├── lib/
│   ├── scoring-engine.ts (unchanged)
│   ├── ai-analysis.ts (modified - add consent wrapper)
│   └── runtime.ts (modified - add diagnostics checks, pinned state detection)
├── types/
│   ├── index.ts (modified - add onboarding, consent fields)
│   └── runtime.ts (modified - add new message types)
└── test/
    ├── setup.ts (unchanged)
    ├── OnboardingChecklist.test.tsx (NEW)
    ├── DiagnosticsPanel.test.tsx (NEW)
    └── content/index.test.ts (NEW - detection logic tests)
```

### Known Issues and Limitations

**Pinned State Detection Uncertainty:**
- Chrome API may not expose extension pinned state to content scripts
- Fallback: Manual checkbox in onboarding

**Selector Fragility:**
- X.com DOM changes frequently may break composer detection
- Mitigation: Log errors, show diagnostics with "Report Issue" link

**Cross-Origin Restrictions:**
- Content scripts cannot make network calls (AI analysis must happen in popup)
- This is already handled in current architecture (popup handles AI calls)

---

**Document Version History:**
- v0.2.0 PRD - Initial creation (2026-02-05) - P0/P1 features mapped to existing codebase

**Next Steps:**
1. Review and approve PRD
2. Run validation workflow (`bmad-bmm-validate-prd`)
3. Create architecture design (`bmad-bmm-create-architecture`)
4. Break down into epics and stories (`bmad-bmm-create-epics-and-stories`)
5. Begin implementation following technical constraints in `_bmad-output/project-context.md`
