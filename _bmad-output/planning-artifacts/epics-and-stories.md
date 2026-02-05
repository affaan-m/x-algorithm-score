---
productName: X Algorithm Score Chrome Extension
version: v0.2.0
author: Dre
date: 2026-02-05
status: Ready for Implementation
---

# Epics and User Stories - X Algorithm Score v0.2.0

## Overview

This document breaks down all P0 and P1 features from the v0.2.0 PRD into implementation-ready epics and user stories. Each story includes acceptance criteria, technical notes, and test requirements.

**Release Scope:** 5 Epics, 20 User Stories
**Target Delivery:** v0.2.0 Chrome Extension Release
**Priority:** P0 (blocker) features must ship; P1 (premium polish) if time permits

---

## Epic 1: Onboarding Experience

**Epic Owner:** Frontend Engineer
**Priority:** P0
**Estimated Effort:** 3-4 days

### Summary

Implement a 3-step checklist onboarding flow that guides new users through extension setup. The checklist auto-detects state and provides clear next steps, reducing first-time user friction and ensuring successful activation.

**Success Metrics:**
- 80%+ of new users complete onboarding in first session
- First-time setup completes in <60 seconds from installation

---

### Story 1.1: Onboarding Checklist UI Component

**Priority:** P0
**Points:** 3

**As a** new user who just installed the extension,
**I want** to see a clear 3-step checklist in the popup,
**So that** I understand exactly what I need to do to get the extension working.

**Acceptance Criteria:**
- [ ] Popup shows `OnboardingChecklist` component when `onboardingCompleted` is false
- [ ] Checklist displays 3 steps: "Extension Loaded", "Pin Extension", "Test Overlay"
- [ ] Each step shows checkmark (✓) or pending icon
- [ ] Step 1 ("Extension Loaded") displays checkmark immediately on mount
- [ ] Steps 2 and 3 display pending state initially
- [ ] Checklist uses lucide-react icons: `CheckCircle` for complete, `Circle` for pending
- [ ] UI styled with Tailwind: consistent spacing, colors, typography
- [ ] Component responsive to popup width (320px minimum)

**Technical Notes:**
- Create `src/popup/OnboardingChecklist.tsx`
- Type: `OnboardingStep = 1 | 2 | 3`
- State interface: `{ loaded: boolean; pinned: boolean; composerDetected: boolean }`
- Props: `onComplete?: () => void` callback
- Auto-detect `loaded` state via `chrome.runtime.getManifest()`

**Test Requirements:**
- Unit test: Component renders with 3 steps
- Unit test: Step 1 shows checkmark on initial render
- Visual test: Checklist renders correctly in popup context

---

### Story 1.2: Auto-Detect Loaded State

**Priority:** P0
**Points:** 2

**As a** user starting the onboarding process,
**I want** the first checklist step to auto-complete,
**So that** I see progress immediately and feel confident the extension is working.

**Acceptance Criteria:**
- [ ] Step 1 ("Extension Loaded") shows checkmark when component mounts
- [ ] Checkmark displays within 100ms of popup open
- [ ] Uses `chrome.runtime.getManifest()` to verify extension loaded
- [ ] Gracefully handles API errors (still shows checkmark as fallback)
- [ ] Status text: "Extension loaded" when complete

**Technical Notes:**
- Function: `detectLoadedState(): boolean`
- Called in `useEffect` on mount
- Error handling: Try/catch around `chrome.runtime.getManifest()`
- Fallback: If API fails, assume loaded (extension is running)

**Test Requirements:**
- Unit test: `detectLoadedState()` returns true when manifest exists
- Unit test: Function handles API errors gracefully
- Integration test: Step 1 checkmark appears on fresh install

---

### Story 1.3: Detect Pinned State (with Fallback)

**Priority:** P0
**Points:** 3

**As a** new user,
**I want** the onboarding checklist to show if I've pinned the extension,
**So that** I know when I've completed that step.

**Acceptance Criteria:**
- [ ] Step 2 attempts to detect pinned state via Chrome API
- [ ] If Chrome API unavailable, show manual checkbox: "I have pinned the extension"
- [ ] When user clicks manual checkbox, step 2 shows checkmark
- [ ] Pinned state detection tries: `chrome.action.getUserSettings()` or similar
- [ ] Manual checkbox persists to next popup open
- [ ] Status text: "Extension pinned" when complete
- [ ] Instructions shown when not complete: "Click puzzle icon, find X Algorithm Score, click pin"

**Technical Notes:**
- Function: `detectPinnedState(): Promise<boolean>`
- API investigation: Check if pinned state is accessible
- Fallback UI: Checkbox with `onChange` handler
- If API fails, render `ManualCheckbox` component
- Store temporary pinned state in React state (not storage)

**Test Requirements:**
- Unit test: `detectPinnedState()` returns boolean
- Unit test: Manual checkbox toggles step state
- Integration test: Manual checkbox persists across popup close/open

---

### Story 1.4: Detect Composer State via Message

**Priority:** P0
**Points:** 3

**As a** new user,
**I want** the checklist to auto-complete when I open the composer on x.com,
**So that** I know my extension is working without manually checking.

**Acceptance Criteria:**
- [ ] Content script sends `COMPOSER_DETECTED` message when composer appears
- [ ] Popup listens for `COMPOSER_DETECTED` via `chrome.runtime.onMessage`
- [ ] Step 3 checkmark appears when message received
- [ ] Checkmark appears within 200ms of composer detection
- [ ] Step 3 text: "Overlay working" when complete
- [ ] Action button shown when not complete: "Go to x.com and click Post"

**Technical Notes:**
- Content script: Add `sendRuntimeMessage({ type: 'COMPOSER_DETECTED' })` when composer detected
- Popup: Add `chrome.runtime.onMessage` listener in `useEffect`
- Store message listener cleanup in `useEffect` return
- Only listen when `OnboardingChecklist` is active

**Test Requirements:**
- Unit test: Message listener receives `COMPOSER_DETECTED`
- Integration test: Step 3 checks when composer opens on x.com
- Manual test: Open composer → reopen popup → step 3 checked

---

### Story 1.5: Persist Onboarding Completion

**Priority:** P0
**Points:** 2

**As a** new user who completed onboarding,
**I want** to see the main popup tabs on subsequent opens,
**So that** I don't see the checklist again after setup is done.

**Acceptance Criteria:**
- [ ] When all 3 steps complete, save `onboardingCompleted: true` to storage
- [ ] Popup checks `onboardingCompleted` on mount
- [ ] If true, hide checklist and show Test/Learn/Settings tabs
- [ ] Storage operation completes within 200ms
- [ ] Error handling: If storage fails, show main tabs anyway (don't block)

**Technical Notes:**
- Storage: `chrome.storage.local.set({ onboardingCompleted: true })`
- Load: `chrome.storage.local.get('onboardingCompleted')` on popup mount
- Add `onboardingCompleted` field to `ExtensionSettings` type
- Add migration logic in `src/background/index.ts` for existing users

**Test Requirements:**
- Unit test: Storage saves `onboardingCompleted` flag
- Unit test: Popup loads main tabs when flag is true
- Integration test: Complete onboarding → reopen popup → see tabs
- Migration test: Existing users see main tabs (not forced into onboarding)

---

## Epic 2: Diagnostics & Troubleshooting

**Epic Owner:** Frontend Engineer
**Priority:** P0
**Estimated Effort:** 3-4 days

### Summary

Implement a diagnostics panel in the Settings tab that helps users troubleshoot overlay issues. The panel runs 3 detection checks and shows actionable fix messages for each failed check, reducing "overlay not working" support requests by 50%.

**Success Metrics:**
- 50% reduction in "overlay not working" GitHub issues
- 40%+ of users successfully resolve issues using diagnostics

---

### Story 2.1: Diagnostics Panel Component

**Priority:** P0
**Points:** 3

**As a** user experiencing overlay issues,
**I want** to see a diagnostics panel in Settings,
**So that** I can understand why the overlay isn't appearing.

**Acceptance Criteria:**
- [ ] `DiagnosticsPanel` renders at top of Settings tab content
- [ ] Panel title: "Overlay not detected"
- [ ] Panel contains 3 diagnostic checks with icons
- [ ] Each check shows: status icon, check name, action message
- [ ] Failed checks show: "Fix" button or link when applicable
- [ ] Panel hidden when all checks pass (overlay detected)
- [ ] Panel shows warning icon (`AlertTriangle` from lucide-react) in header
- [ ] Styling: Gray background (`bg-gray-50`), rounded corners

**Technical Notes:**
- Create `src/popup/DiagnosticsPanel.tsx`
- Props: `checks: DiagnosticCheck[]`
- Type: `DiagnosticCheck = { id: 'hostname' | 'composer' | 'settings'; name: string; passed: boolean; message: string; action: string; fixUrl?: string }`
- Conditionally render based on `checks.every(c => c.passed)`

**Test Requirements:**
- Unit test: Component renders with all 3 checks
- Unit test: Panel hides when all checks pass
- Visual test: Panel displays in Settings context

---

### Story 2.2: Hostname Check Implementation

**Priority:** P0
**Points:** 2

**As a** user,
**I want** the diagnostics to check if I'm on x.com/twitter.com,
**So that** I know to navigate there if I'm not.

**Acceptance Criteria:**
- [ ] Check 1: "On x.com" shows checkmark if `hostname` includes 'x.com' or 'twitter.com'
- [ ] Failed state: ✗ icon, message "Not on x.com", action "Navigate to x.com"
- [ ] Passed state: ✓ icon, message "On x.com"
- [ ] Fix button opens x.com in new tab (`chrome.tabs.create({ url: 'https://x.com' })`)
- [ ] Check runs within 10ms (O(1) string comparison)

**Technical Notes:**
- Function: `checkHostname(): DiagnosticCheck`
- Implementation: `window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')`
- Note: This check runs in popup context, so uses `window.location.hostname` of active tab

**Test Requirements:**
- Unit test: Returns `passed: true` for x.com hostname
- Unit test: Returns `passed: false` for example.com
- Integration test: Fix button navigates to x.com

---

### Story 2.3: Composer Check Implementation

**Priority:** P0
**Points:** 3

**As a** user,
**I want** the diagnostics to check if the composer is open,
**So that** I know to click the Post button if it's not.

**Acceptance Criteria:**
- [ ] Check 2: "Composer open" shows checkmark if composer DOM exists
- [ ] Failed state: ✗ icon, message "Composer not open", action "Click Post button"
- [ ] Passed state: ✓ icon, message "Composer open"
- [ ] Composer selector: `[data-testid="tweetTextarea_0"]`
- [ ] Check query executes in content script context
- [ ] If content script not injected (not on x.com), check fails gracefully

**Technical Notes:**
- Function: `checkComposer(): DiagnosticCheck`
- Implementation: `document.querySelector(SELECTORS.composer) !== null`
- This check requires querying the active tab's DOM
- Use `chrome.tabs.sendMessage` to query content script
- Fallback: If tab not x.com, assume composer not found

**Test Requirements:**
- Unit test: Returns `passed: true` when composer element exists
- Unit test: Returns `passed: false` when composer missing
- Integration test: Check passes when composer opens

---

### Story 2.4: Settings Check Implementation

**Priority:** P0
**Points:** 2

**As a** user,
**I want** the diagnostics to check if extension settings are enabled,
**So that** I know to enable them if they're disabled.

**Acceptance Criteria:**
- [ ] Check 3: "Extension enabled" shows checkmark if both toggles are on
- [ ] Failed state: ✗ icon, message "Extension disabled", action "Enable in Settings"
- [ ] Passed state: ✓ icon, message "Extension enabled and overlay visible"
- [ ] Checks both: `enabled === true` AND `showScoreInComposer === true`
- [ ] Fix button auto-enables toggles and saves to storage
- [ ] Settings loaded from `chrome.storage.local`

**Technical Notes:**
- Function: `checkSettings(): DiagnosticCheck`
- Implementation: Read `ExtensionSettings` from storage
- Check both conditions: `settings.enabled && settings.showScoreInComposer`
- Fix action: `chrome.storage.local.set({ enabled: true, showScoreInComposer: true })`

**Test Requirements:**
- Unit test: Returns `passed: true` when both settings are true
- Unit test: Returns `passed: false` when any setting is false
- Integration test: Fix button enables settings

---

### Story 2.5: Integrate Diagnostics into Settings Tab

**Priority:** P0
**Points:** 3

**As a** user with overlay issues,
**I want** the diagnostics panel to auto-run when I open Settings,
**So that** I can see the problem immediately without manual action.

**Acceptance Criteria:**
- [ ] Settings tab mounts → runs `runAllDiagnostics()`
- [ ] Diagnostic checks run in parallel (Promise.all)
- [ ] Results update `DiagnosticsPanel` component state
- [ ] Panel re-renders when conditions change (storage change listener)
- [ ] Storage listener triggers re-run of diagnostics
- [ ] Panel auto-refreshes when user fixes an issue
- [ ] Loading state shown while checks run (spinner icon)

**Technical Notes:**
- Function: `runAllDiagnostics(): Promise<DiagnosticCheck[]>`
- Implementation: `Promise.all([checkHostname(), checkComposer(), checkSettings()])`
- Storage listener: `chrome.storage.onChanged.addListener((changes) => { runAllDiagnostics() })`
- Cleanup listener on component unmount
- Add loading state: `isChecking: boolean`

**Test Requirements:**
- Unit test: `runAllDiagnostics()` returns array of 3 checks
- Unit test: Storage change triggers re-run
- Integration test: Panel updates when settings toggle changes

---

## Epic 3: AI Privacy & Consent

**Epic Owner:** Frontend Engineer
**Priority:** P0
**Estimated Effort:** 2-3 days

### Summary

Implement an explicit privacy consent modal that appears before the first AI analysis call. This ensures users understand that their tweet text is sent to Anthropic API using their API key, building trust through transparency.

**Success Metrics:**
- 60%+ of users who see AI privacy notice accept consent and proceed
- Zero confusion about AI data usage before first API call

---

### Story 3.1: AI Consent Modal Component

**Priority:** P0
**Points:** 3

**As a** new AI user,
**I want** to see a clear privacy consent modal before my first analysis,
**So that** I understand what happens to my data before proceeding.

**Acceptance Criteria:**
- [ ] `AIConsentModal` renders as centered modal with backdrop
- [ ] Modal title: "AI Privacy Notice"
- [ ] Body explains: "Your draft text will be sent to Anthropic's API using your API key. We never see or store your data."
- [ ] Footer contains two buttons: "Cancel" (secondary) and "I understand, continue" (primary)
- [ ] Backdrop has blur effect (`backdrop-blur-sm`)
- [ ] Modal traps focus (tab cycles within modal)
- [ ] Escape key closes modal (same as Cancel)
- [ ] Modal prevents interaction with popup content underneath

**Technical Notes:**
- Create `src/popup/AIConsentModal.tsx`
- Props: `onAccept: () => void`, `onDecline: () => void`
- Focus trap: Use `useEffect` to manage focus within modal
- Escape handler: `useEffect` with `keydown` listener
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

**Test Requirements:**
- Unit test: Modal renders with correct content
- Unit test: Escape key triggers onDecline
- Accessibility test: Focus stays within modal
- Visual test: Modal renders with backdrop

---

### Story 3.2: Consent Guard Higher-Order Function

**Priority:** P0
**Points:** 3

**As a** developer,
**I want** a reusable function to wrap AI analysis calls with consent logic,
**So that** all AI actions require consent consistently.

**Acceptance Criteria:**
- [ ] `withConsent()` HOF accepts async function and storage key
- [ ] Checks `aiConsentAccepted` flag in storage before calling action
- [ ] If flag false, shows consent modal and waits for user action
- [ ] If user accepts, stores consent flag and calls action
- [ ] If user declines, rejects promise (no API call)
- [ ] If flag true, calls action immediately (no modal)
- [ ] Type-safe: Returns `Promise<T>` matching action return type

**Technical Notes:**
- Create `src/lib/consent-guard.ts`
- Export: `withConsent<T>(action: () => Promise<T>, consentKey?: string): Promise<T>`
- Implementation: Check storage → conditional modal → resolve/reject
- Storage key default: `'aiConsentAccepted'`
- Modal integration: Need to pass React state setter to show modal

**Test Requirements:**
- Unit test: Calls action directly when consent accepted
- Unit test: Shows modal when consent not accepted
- Unit test: Rejects when user declines consent
- Integration test: Consent persists across sessions

---

### Story 3.3: Integrate Consent Guard into AI Analysis

**Priority:** P0
**Points:** 2

**As a** user clicking "Analyze with Claude",
**I want** to see the consent modal before the first analysis,
**So that** I can make an informed decision about my data.

**Acceptance Criteria:**
- [ ] `handleAIAnalysis` in Popup.tsx wrapped with `withConsent()`
- [ ] On first click, modal appears (no API call yet)
- [ ] User accepts → consent saved → API call executes → results display
- [ ] User declines → modal closes → no API call → user remains on test tab
- [ ] Subsequent clicks skip modal and call API directly
- [ ] Consent flag persists across popup closures (stored in chrome.storage.local)

**Technical Notes:**
- Modify `src/popup/Popup.tsx`
- Add state: `showConsentModal: boolean`
- Wrap handler: `const handleAIAnalysisWithConsent = () => withConsent(analyzeWithClaude, 'aiConsentAccepted')`
- Note: Consent modal needs to be rendered conditionally in Popup.tsx
- Storage: `chrome.storage.local.set({ aiConsentAccepted: true })` on accept

**Test Requirements:**
- Integration test: First click shows modal
- Integration test: Acceptance saves consent and runs analysis
- Integration test: Decline skips API call
- Integration test: Second click runs analysis without modal

---

## Epic 4: Premium Overlay Polish

**Epic Owner:** Frontend Engineer
**Priority:** P1
**Estimated Effort:** 2-3 days

### Summary

Add premium UX polish to the content overlay including hover peek preview and score-change pulse animation. These micro-interactions delight users and reduce friction for frequent users.

**Success Metrics:**
- Users report feeling "confident" about understanding their score
- Hover peek renders within 30ms of mouse hover
- Pulse animation respects `prefers-reduced-motion`

---

### Story 4.1: Overlay Hover Peek Component

**Priority:** P1
**Points:** 3

**As a** frequent user,
**I want** to see a preview of my score and top suggestion on hover,
**So that** I can quickly assess my tweet without expanding the overlay.

**Acceptance Criteria:**
- [ ] `HoverPeek` component renders above/beside collapsed badge
- [ ] Peek displays: Score badge (e.g., "85 / A") and top suggestion text
- [ ] Peek appears on `onMouseEnter` and disappears on `onMouseLeave`
- [ ] Peek also shows on `onFocus` for keyboard users
- [ ] Peek renders within 30ms of hover/focus
- [ ] Peek width: 240px (vs 120px collapsed badge, 340px expanded)
- [ ] Peek has smooth width transition (180ms ease)
- [ ] Peek z-index ensures it appears above other page elements

**Technical Notes:**
- Create `src/content/components/HoverPeek.tsx`
- Props: `score: TweetScore | null`
- Integrate into `ScoreOverlay.tsx`: Add state `isPeeked: boolean`
- Events: `onMouseEnter`, `onMouseLeave`, `onFocus`, `onBlur`
- CSS: Use `data-peek` attribute for conditional width animation

**Test Requirements:**
- Unit test: Peek renders with score and suggestion
- Visual test: Peek appears on hover
- Performance test: Peek renders within 30ms
- Accessibility test: Peek shows on focus

---

### Story 4.2: Score-Change Pulse Animation

**Priority:** P1
**Points:** 2

**As a** user typing in the composer,
**I want** to see a subtle pulse when my score changes,
**So that** I get immediate visual feedback about the impact of my edits.

**Acceptance Criteria:**
- [ ] Pulse animation triggers when score value changes
- [ ] Animation: Scale up/down (1.02x) with box-shadow flash
- [ ] Duration: 300ms total
- [ ] Animation triggers on any score change (numeric or grade)
- [ ] Animation disabled when `prefers-reduced-motion` is true
- [ ] Animation can be disabled via `animationsEnabled` setting
- [ ] Pulse only triggers when overlay is collapsed (not expanded)

**Technical Notes:**
- CSS: `@keyframes scoreUpdate` already defined in `src/content/styles.css`
- React: `useEffect` with `[score?.overall]` dependency
- Add state: `scorePulse: boolean`
- Add `animationsEnabled` to `ExtensionSettings`
- Check media query: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`

**Test Requirements:**
- Unit test: Pulse state toggles when score changes
- Visual test: Pulse animation plays
- Accessibility test: Pulse disabled with reduced motion
- Settings test: Pulse disabled when setting is false

---

### Story 4.3: Animations Enabled Setting

**Priority:** P1
**Points:** 1

**As a** user who prefers minimal motion,
**I want** to disable animations via a setting,
**So that** I can use the extension without distracting animations.

**Acceptance Criteria:**
- [ ] Add toggle: "Enable animations" in Settings tab
- [ ] Toggle defaults to `true` (animations enabled)
- [ ] When `false`, pulse animation does not trigger
- [ ] When `false`, hover peek transition still works (smooth, but no pulse)
- [ ] Setting persists to `chrome.storage.local`
- [ ] Pulse animation checks this setting before animating

**Technical Notes:**
- Add field to `ExtensionSettings`: `animationsEnabled?: boolean`
- Default: `true`
- Add toggle UI in Settings tab (below existing toggles)
- Pulse logic: `if (!animationsEnabled) return;`

**Test Requirements:**
- Unit test: Setting saves to storage
- Integration test: Pulse disabled when setting is false
- Integration test: Toggle persists across sessions

---

## Epic 5: Accessibility & Keyboard Navigation

**Epic Owner:** Frontend Engineer
**Priority:** P1
**Estimated Effort:** 2-3 days

### Summary

Implement full keyboard navigation and ARIA support across popup and overlay components. This ensures the extension is accessible to all users, meeting WCAG AA standards and demonstrating premium quality.

**Success Metrics:**
- All interactive elements reachable via Tab key
- Escape closes overlays and modals
- ARIA labels on all buttons and tabs
- Screen reader announces score changes

---

### Story 5.1: Popup Tabs Keyboard Navigation

**Priority:** P1
**Points:** 2

**As a** keyboard user,
**I want** to navigate between popup tabs using the Tab key,
**So that** I can access all features without a mouse.

**Acceptance Criteria:**
- [ ] Tab key cycles through Test, Learn, Settings tab buttons
- [ ] Focused tab has visible outline (2px solid #1DA1F2)
- [ ] Enter or Space key activates focused tab
- [ ] Arrow keys (Left/Right) cycle between tabs
- [ ] Tab navigation is logical: tabs first, then tab content
- [ ] ARIA attributes: `role="tablist"` on container, `role="tab"` on buttons
- [ ] `aria-selected="true"` on active tab, `aria-selected="false"` on others
- [ ] `aria-controls` links tab button to tab content panel

**Technical Notes:**
- Modify `src/popup/Popup.tsx` tab rendering
- Add event handlers: `onKeyDown` for Tab/Enter/Space/Arrow keys
- ARIA attributes: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-labelledby`
- Focus management: `useRef` to track focused tab

**Test Requirements:**
- Keyboard test: Tab cycles through tabs
- Keyboard test: Enter activates focused tab
- Keyboard test: Arrow keys cycle tabs
- Accessibility test: Screen reader announces tab selection

---

### Story 5.2: Overlay Keyboard Navigation

**Priority:** P1
**Points:** 3

**As a** keyboard user,
**I want** to navigate the expanded overlay using the Tab key,
**So that** I can access all score details without a mouse.

**Acceptance Criteria:**
- [ ] Tab key cycles through: score badge, suggestions, algorithm factors tabs, close button
- [ ] Focused element has visible outline (2px solid #1DA1F2)
- [ ] Enter or Space key activates focused element (expand/collapse)
- [ ] Escape key collapses overlay (already implemented, verify ARIA)
- [ ] Tab order is logical: top to bottom, left to right
- [ ] ARIA attributes: `aria-expanded="true"` on expanded badge
- [ ] `aria-controls` links badge to overlay content
- [ ] `aria-label` on interactive elements without visible text

**Technical Notes:**
- Modify `src/content/components/ScoreOverlay.tsx`
- Ensure all interactive elements are `button` or `a` tags (focusable by default)
- Add `tabIndex={0}` to non-button interactive elements if needed
- Verify existing Escape handler (lines 80-89)
- ARIA: `aria-expanded`, `aria-controls`, `aria-label`

**Test Requirements:**
- Keyboard test: Tab cycles through overlay elements
- Keyboard test: Enter expands/collapses overlay
- Keyboard test: Escape collapses overlay
- Accessibility test: Screen reader announces expanded state

---

### Story 5.3: Hover Peek Keyboard Support

**Priority:** P1
**Points:** 2

**As a** keyboard user,
**I want** to see the hover peek content when the badge is focused,
**So that** I can preview my score without expanding.

**Acceptance Criteria:**
- [ ] Badge shows peek content when focused (`onFocus`)
- [ ] Badge hides peek content when focus lost (`onBlur`)
- [ ] Peek content matches mouse hover content (score + top suggestion)
- [ ] Focus state shows same peek as hover (no separate implementation)
- [ ] Tab key moves focus in and out of badge (peek appears/disappears)

**Technical Notes:**
- Modify `src/content/components/ScoreOverlay.tsx` badge button
- Add `onFocus={() => setIsPeeked(true)}`
- Add `onBlur={() => setIsPeeked(false)}`
- Existing hover logic (`onMouseEnter`, `onMouseLeave`) already handles peek
- Peek state is shared between hover and focus

**Test Requirements:**
- Keyboard test: Focus shows peek content
- Keyboard test: Blur hides peek content
- Accessibility test: Screen reader announces peek content

---

### Story 5.4: Screen Reader Announcements

**Priority:** P1
**Points:** 3

**As a** screen reader user,
**I want** to hear announcements about score changes and overlay state,
**So that** I can stay informed about my tweet score.

**Acceptance Criteria:**
- [ ] Score badge has `aria-live="polite"` for dynamic updates
- [ ] Screen reader announces "Score 85, grade A" when score updates
- [ ] Overlay expand/collapse triggers `aria-live` announcement
- [ ] Announcements: "Overlay expanded" / "Overlay collapsed"
- [ ] Error messages use `role="alert"` for immediate announcement
- [ ] All icons have `aria-label` or decorative `aria-hidden="true"`
- [ ] Buttons without visible text have descriptive `aria-label`

**Technical Notes:**
- Add `aria-live="polite"` to score region in `ScoreOverlay.tsx`
- Add `role="alert"` to error messages in Popup.tsx
- Add `aria-label` to icon-only buttons
- Add `aria-hidden="true"` to decorative icons (e.g., checkmarks when not actionable)
- Live region should contain minimal content to avoid verbosity

**Test Requirements:**
- Screen reader test: Announces score changes
- Screen reader test: Announces overlay expand/collapse
- Screen reader test: Announces error messages
- Accessibility test: All buttons have accessible names

---

### Story 5.5: Reduced Motion Support

**Priority:** P1
**Points:** 2

**As a** user with motion sensitivity,
**I want** all animations to respect `prefers-reduced-motion`,
**So that** I can use the extension without triggering nausea or dizziness.

**Acceptance Criteria:**
- [ ] All CSS animations check `@media (prefers-reduced-motion: reduce)`
- [ ] Hover peek transition is disabled when reduced motion is enabled
- [ ] Score pulse animation is disabled when reduced motion is enabled
- [ ] Overlay expand/collapse transition is disabled when reduced motion is enabled
- [ ] AnimationsEnabled setting still overrides when disabled by user
- [ ] No `prefers-reduced-motion` check breaks layout (animations simply skipped)

**Technical Notes:**
- CSS: Add `@media (prefers-reduced-motion: reduce) { }` blocks in `src/content/styles.css`
- Hover peek width transition: `transition: none !important;`
- Pulse animation: `animation: none;`
- Overlay width: `transition: none !important;`
- Check media query in React: `window.matchMedia('(prefers-reduced-motion: reduce)').matches`

**Test Requirements:**
- Visual test: Animations disabled in OS settings
- Visual test: Hover peek instant (no transition) with reduced motion
- Visual test: Pulse disabled with reduced motion
- Settings test: AnimationsEnabled toggle works independently

---

## Cross-Epic Considerations

### Testing Strategy

**Unit Tests (Vitest):**
- All detection logic functions (`checkHostname`, `checkComposer`, `checkSettings`)
- Consent guard function (`withConsent`)
- Component rendering tests (`OnboardingChecklist`, `DiagnosticsPanel`, `AIConsentModal`)
- State management tests (onboarding completion, diagnostics updates)

**Integration Tests (Manual):**
- Full onboarding flow (install → checklist → tabs)
- Full diagnostics flow (overlay missing → diagnostics → fix)
- Full consent flow (click analyze → modal → accept → results)
- Accessibility tests (keyboard, screen reader)

**Performance Tests:**
- Overlay render latency (<50ms)
- Hover peek render latency (<30ms)
- Pulse animation duration (300ms)
- Popup open latency (<100ms)

### Dependencies

**Epic 1 depends on:**
- Storage schema updated (onboardingCompleted field)
- Runtime message types updated (COMPOSER_DETECTED)

**Epic 2 depends on:**
- Storage schema updated (for settings check)
- Content script detection helpers (checkComposer)

**Epic 3 depends on:**
- Storage schema updated (aiConsentAccepted field)
- Existing AI analysis function (`analyzeWithClaude`)

**Epic 4 depends on:**
- Storage schema updated (animationsEnabled field)
- Existing ScoreOverlay component

**Epic 5 depends on:**
- All previous epics (adds accessibility to existing components)

### Risk Mitigation

**Risk: Chrome API for pinned state not available**
- Mitigation: Manual checkbox fallback (Story 1.3)

**Risk: Content script performance impact**
- Mitigation: Debounced input (already implemented), observer throttling (Story 4.2)

**Risk: X.com DOM selector changes**
- Mitigation: Fallback selectors, error logging (Story 2.3)

**Risk: Screen reader verbosity**
- Mitigation: Minimal live regions, avoid duplicate announcements (Story 5.4)

---

## Implementation Order

**Phase 1: Foundation (Days 1-3)**
1. Story 1.5: Persist Onboarding Completion (storage schema)
2. Story 1.1: Onboarding Checklist UI Component
3. Story 1.2: Auto-Detect Loaded State
4. Story 3.2: Consent Guard HOF
5. Story 3.3: Integrate Consent Guard

**Phase 2: Core Features (Days 4-7)**
6. Story 1.3: Detect Pinned State (with Fallback)
7. Story 1.4: Detect Composer State via Message
8. Story 2.1: Diagnostics Panel Component
9. Story 2.2: Hostname Check Implementation
10. Story 2.3: Composer Check Implementation
11. Story 2.4: Settings Check Implementation
12. Story 2.5: Integrate Diagnostics into Settings
13. Story 3.1: AI Consent Modal Component

**Phase 3: Premium Polish (Days 8-10)**
14. Story 4.1: Overlay Hover Peek Component
15. Story 4.2: Score-Change Pulse Animation
16. Story 4.3: Animations Enabled Setting
17. Story 5.1: Popup Tabs Keyboard Navigation
18. Story 5.2: Overlay Keyboard Navigation
19. Story 5.3: Hover Peek Keyboard Support
20. Story 5.4: Screen Reader Announcements
21. Story 5.5: Reduced Motion Support

**Phase 4: Testing & Polish (Days 11-12)**
- Run full unit test suite
- Manual E2E testing
- Accessibility testing (keyboard, screen reader)
- Performance testing
- Bug fixes

---

## Release Checklist

**Pre-Release:**
- [ ] All P0 stories completed and tested
- [ ] Unit tests passing (>90% coverage on new code)
- [ ] Manual E2E testing completed
- [ ] Accessibility testing completed
- [ ] Performance benchmarks met (<50ms overlay, <30ms peek)
- [ ] Chrome Web Store policy review (permissions, privacy)
- [ ] Privacy Policy updated with AI usage details

**Release:**
- [ ] Version bump to 0.2.0 in package.json and manifest
- [ ] Build with `npm run build`
- [ ] Load unpacked in Chrome for final verification
- [ ] Submit to Chrome Web Store
- [ ] Tag release in Git: `v0.2.0`

**Post-Release:**
- [ ] Monitor user onboarding completion rate
- [ ] Track GitHub issues for "overlay not working" reports
- [ ] Monitor AI consent acceptance rate
- [ ] Collect user feedback on P1 features (hover peek, pulse)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Status:** Ready for Implementation
