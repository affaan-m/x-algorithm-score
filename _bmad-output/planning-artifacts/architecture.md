# Technical Architecture Document - X Algorithm Score v0.2.0

**Author:** Architecture Workflow
**Date:** 2026-02-05
**Version:** v0.2.0
**Status:** Complete

---

## Executive Summary

This document defines the technical architecture for X Algorithm Score v0.2.0 enhancement. The architecture builds upon the existing Chrome Extension (Manifest V3) foundation with minimal new dependencies, focusing on premium UX improvements across popup (`src/popup/`) and content overlay (`src/content/`) contexts.

**Key Architectural Principles:**
- **Privacy-First:** All data stays local; AI analysis uses user-provided key
- **No New Permissions:** Leverages existing `storage` permission only
- **Component-Based:** Reusable React components with clear separation of concerns
- **Type-Safe:** Full TypeScript coverage with discriminated unions for runtime messages
- **Accessibility-First:** Keyboard navigation and ARIA support from day one

---

## System Architecture Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Chrome Browser Context                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐    chrome.runtime.sendMessage()    ┌─────────────┐ │
│  │   Popup UI      │ ◄─────────────────────────────────► │ Background   │ │
│  │  (src/popup/)   │                                    │ Service      │ │
│  │                 │     chrome.storage.onChanged        │ Worker       │ │
│  │  - Onboarding   │                                    │ (minimal)    │ │
│  │  - Settings     │                                    │              │ │
│  │  - Diagnostics  │                                    │              │ │
│  │  - AI Consent   │                                    │              │ │
│  └────────┬────────┘                                    └──────┬───────┘ │
│           │                                                    │         │
│           │ No direct communication (same-origin policy)      │         │
│           │                                                    │         │
│           │                                                    │         │
│  ┌────────▼─────────┐    chrome.storage.local (shared state)  │         │
│  │ Content Script   │ ◄──────────────────────────────────────┘         │
│  │ (src/content/)   │                                              │
│  │                                                                  │
│  │  - Composer Detection  ───────────► [DOM Observer]              │
│  │  - Score Overlay       ───────────► [React Root]                │
│  │  - Pulse Animation      ───────────► [CSS + React Effect]       │
│  │                                                                  │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ chrome.storage.local (Persistent State)                          │ │
│  │                                                                  │ │
│  │ settings: {                                                       │ │
│  │   enabled, showScoreInComposer, showSuggestions,                │ │
│  │   minScoreAlert, darkMode, analyticsEnabled,                    │ │
│  │   onboardingCompleted,      ← NEW for v0.2.0                    │ │
│  │   aiConsentAccepted,        ← NEW for v0.2.0                    │ │
│  │   animationsEnabled         ← NEW for v0.2.0                    │ │
│  │ }                                                                │ │
│  │ claudeApiKey: string (encrypted at OS level)                   │ │
│  │ scoreHistory: ScoreLogEntry[] (max 100)                           │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Extension Contexts and Responsibilities

| Context          | File Location              | Responsibilities                                                                 |
|------------------|----------------------------|---------------------------------------------------------------------------------|
| **Popup**        | `src/popup/Popup.tsx`      | User settings, onboarding flow, AI consent, diagnostics, test mode              |
| **Content Script** | `src/content/index.tsx`   | Composer detection, real-time scoring, overlay rendering, keyboard navigation  |
| **Background**   | `src/background/index.ts`  | Storage operations, message routing, install/update handling (minimal role)    |
| **Libraries**    | `src/lib/`                 | Runtime messaging, diagnostics checks, consent guards, scoring (unchanged)   |

---

## Component Architecture

### P0 Features - Component Mapping

#### 1. Onboarding Checklist (`OnboardingChecklist.tsx`)

**Location:** `src/popup/OnboardingChecklist.tsx` (NEW)

**Responsibilities:**
- Display 3-step activation checklist
- Auto-detect loaded state (step 1)
- Detect pinned state via Chrome API or manual checkbox (step 2)
- Detect composer state via message from content script (step 3)
- Persist onboarding completion to storage

**Component Structure:**
```
OnboardingChecklist
├── CheckItem (step 1: "Extension Loaded")
│   ├── CheckIcon (✓/✗)
│   ├── StatusText
│   └── Description
├── CheckItem (step 2: "Pin Extension")
│   ├── CheckIcon (✓/✗)
│   ├── StatusText
│   ├── PinInstructions (icon + text)
│   └── ManualCheckbox (fallback if API unavailable)
└── CheckItem (step 3: "Test Overlay")
    ├── CheckIcon (✓/✗)
    ├── StatusText
    └── ActionButton ("Go to x.com")
```

**State Management:**
```typescript
interface OnboardingState {
  currentStep: 1 | 2 | 3;
  steps: {
    loaded: boolean;      // Auto-detected via chrome.runtime.getManifest()
    pinned: boolean;      // Chrome API or manual checkbox
    composerDetected: boolean; // Message from content script
  };
  onboardingCompleted: boolean;
}
```

**Data Flow:**
1. Popup mounts → Load `onboardingCompleted` from storage
2. If not completed → Show `OnboardingChecklist`
3. Step 1: Auto-check `loaded` immediately
4. Step 2: Query pinned state OR wait for manual checkbox
5. Content script detects composer → Send `COMPOSER_DETECTED` message → Popup checks step 3
6. All steps complete → Save `onboardingCompleted: true` → Hide checklist, show tabs

**Dependencies:**
- `chrome.runtime.getManifest()` for step 1
- `sendRuntimeMessage()` to query pinned state
- `chrome.storage.onChanged` listener for step 3

#### 2. Diagnostics Panel (`DiagnosticsPanel.tsx`)

**Location:** `src/popup/DiagnosticsPanel.tsx` (NEW)

**Responsibilities:**
- Display 3 diagnostic checks when overlay not detected
- Show checkmark/X icon for each check
- Display actionable fix message for each failed check
- Re-run checks on user demand

**Component Structure:**
```
DiagnosticsPanel
├── PanelHeader ("Overlay not detected")
├── DiagnosticCheck (check 1: "On x.com")
│   ├── StatusIcon (✓/✗)
│   ├── CheckText
│   ├── ActionMessage
│   └── FixButton ("Navigate to x.com")
├── DiagnosticCheck (check 2: "Composer open")
│   ├── StatusIcon (✓/✗)
│   ├── CheckText
│   ├── ActionMessage
│   └── FixButton ("Click Post button")
└── DiagnosticCheck (check 3: "Extension enabled")
    ├── StatusIcon (✓/✗)
    ├── CheckText
    ├── ActionMessage
    └── FixButton ("Enable in Settings")
```

**Diagnostic Check Interface:**
```typescript
interface DiagnosticCheck {
  id: 'hostname' | 'composer' | 'settings';
  name: string;
  passed: boolean;
  message: string;
  action: string;
  fixUrl?: string;
}
```

**Detection Logic Location:**
- `checkHostname()`: `src/lib/diagnostics.ts` (NEW)
- `checkComposer()`: `src/lib/diagnostics.ts` (NEW)
- `checkSettings()`: `src/lib/diagnostics.ts` (NEW)

**Data Flow:**
1. Settings tab mounts → Check if overlay detected
2. If not detected → Render `DiagnosticsPanel` at top
3. Call `runAllDiagnostics()` → Returns `DiagnosticCheck[]`
4. Render checks with pass/fail status
5. User clicks fix button → Navigate or update settings
6. Panel auto-refreshes on storage change

#### 3. AI Privacy Consent Modal (`AIConsentModal.tsx`)

**Location:** `src/popup/AIConsentModal.tsx` (NEW)

**Responsibilities:**
- Display privacy notice before first AI analysis
- Explain data flow to Anthropic API
- Store consent flag locally on acceptance
- Allow decline without proceeding

**Component Structure:**
```
AIConsentModal
├── ModalBackdrop (fixed position, blur)
├── ModalCard
│   ├── ModalHeader ("AI Privacy Notice")
│   ├── ModalBody
│   │   ├── PrivacyExplanation
│   │   │   ├── DataFlowIcon
│   │   │   ├── DataFlowText ("Your draft → Anthropic API → Response")
│   │   │   └── DataFlowText ("We never see or store your data")
│   │   └── APIKeyNote
│   └── ModalFooter
│       ├── Button (secondary: "Cancel")
│       └── Button (primary: "I understand, continue")
```

**Consent Guard Pattern:**
```typescript
// src/lib/consent-guard.ts (NEW)
export function withConsent<T>(
  action: () => Promise<T>,
  storageKey: string = 'aiConsentAccepted'
): Promise<T> {
  // Check storage for consent
  // If not consented, show modal
  // Store consent on acceptance
  // Proceed with action
}
```

**Data Flow:**
1. User clicks "Analyze with Claude" in Test tab
2. `handleAIAnalysis` wrapped with `withConsent()`
3. Check `aiConsentAccepted` in storage
4. If false → Show `AIConsentModal`
5. User clicks "I understand" → Save `aiConsentAccepted: true` → Call API
6. Future calls skip modal

#### 4. Better Failure Microcopy

**Location:** Integrated into existing components

**Updates Required:**

**Popup Context (`src/popup/Popup.tsx`):**
- Show message when not on x.com (any tab)
- Message: "X Algorithm Score only works on x.com. Please navigate to x.com to see scores."

**Settings Tab (`src/popup/Popup.tsx` - SettingsTab):**
- When composer not open: "No tweet composer detected. Click the 'Post' button to compose a new tweet."
- When overlay disabled: "Overlay is disabled. Enable 'Show score while composing' in Settings to see real-time scores."

**Content Script (`src/content/index.tsx`):**
- Log errors when selector fails
- Show console message for debugging

### P1 Features - Component Mapping

#### 5. Score-Change Pulse (`ScorePulse.tsx`)

**Location:** Inline effect in `ScoreOverlay.tsx` (MODIFIED)

**Responsibilities:**
- Subtle animation when score changes
- Respects `prefers-reduced-motion` media query
- Can be disabled via settings

**Implementation:**
```typescript
// Already implemented in ScoreOverlay.tsx (lines 72-77)
useEffect(() => {
  if (!score) return;
  setScorePulse(true);
  const t = window.setTimeout(() => setScorePulse(false), 320);
  return () => window.clearTimeout(t);
}, [score?.overall]);
```

**CSS Animation:**
```css
/* Already defined in src/content/styles.css (lines 246-263) */
@keyframes scoreUpdate {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(29, 161, 242, 0); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(29, 161, 242, 0.08); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(29, 161, 242, 0); }
}

.score-updated {
  animation: scoreUpdate 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .score-updated {
    animation: none;
  }
}
```

**Settings Integration:**
- Add `animationsEnabled` to `ExtensionSettings`
- Check setting before applying pulse class

#### 7. Full Keyboard/Focus Support

**Location:** Multiple files (MODIFIED)

**Requirements:**

**Popup Tabs (`src/popup/Popup.tsx`):**
- Tab key cycles through Test, Learn, Settings
- Enter/Space activates focused tab
- Visual focus indicator (outline)
- ARIA attributes: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`

**Expanded Overlay (`src/content/components/ScoreOverlay.tsx`):**
- Tab key cycles through score, suggestions, factors tabs
- Escape key collapses overlay
- ARIA attributes: `aria-expanded`, `aria-controls`, `aria-label`

**Focus Management:**
```typescript
// Escape to collapse (already implemented in ScoreOverlay.tsx lines 80-89)
useEffect(() => {
  if (!isExpanded) return;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, [isExpanded]);
```

---

## Data Flow Diagrams

### Onboarding Flow

```
┌─────────────┐
│ User Installs │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Popup Opens (First Time)             │
│ - Load onboardingCompleted from      │
│   chrome.storage.local               │
│ - Check: false → Show Checklist      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Step 1: Extension Loaded             │
│ - Auto-check (chrome.runtime.getManifest) │
│ - ✓ immediately                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Step 2: Pin Extension               │
│ - Try: chrome.action API            │
│ - Fallback: Manual checkbox         │
│ - ✓ when pinned or checked          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User goes to x.com                  │
│ Content Script initializes          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User clicks Compose button          │
│ - Content script detects composer   │
│ - Sends message: COMPOSER_DETECTED   │
└──────┬──────────────────────────────┘
       │ chrome.runtime.sendMessage()
       ▼
┌─────────────────────────────────────┐
│ Popup receives COMPOSER_DETECTED    │
│ - Check step 3                      │
│ - ✓ automatically                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ All Steps Complete                  │
│ - Save: onboardingCompleted = true  │
│ - Hide checklist, show tabs         │
└─────────────────────────────────────┘
```

### AI Consent Flow

```
┌─────────────┐
│ User clicks  │
│ "Analyze"   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Popup: handleAIAnalysis()           │
│ - Wrapped with withConsent()        │
│ - Check storage: aiConsentAccepted  │
└──────┬──────────────────────────────┘
       │
       │ false?
       ├──────────────┐
       │              │
       │              ▼
       │    ┌─────────────────────────────────────┐
       │    │ Show AIConsentModal                 │
       │    │ - Display privacy notice            │
       │    │ - Wait for user action              │
       │    └──────┬──────────────────────────────┘
       │           │
       │           ├──────────────┐
       │           │              │
       │           │ Decline       │ Accept
       │           │              │
       │           ▼              ▼
       │    ┌─────────────┐  ┌─────────────────────────────────────┐
       │    │ Close modal │  │ Save: aiConsentAccepted = true      │
       │    │ (no API)    │  │ Call analyzeWithClaude()            │
       │    └─────────────┘  └─────────────────────────────────────┘
       │                              │
       │                              ▼
       │                    ┌─────────────────────────────────────┐
       │                    │ Display results in popup          │
       │                    └─────────────────────────────────────┘
       │
       │ true?
       └──────────────┐
                      │
                      ▼
           ┌─────────────────────────────────────┐
           │ Call analyzeWithClaude() directly    │
           │ Display results                      │
           └─────────────────────────────────────┘
```

### Diagnostics Flow

```
┌─────────────┐
│ User opens  │
│ Settings tab│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ SettingsTab mounts                   │
│ - Run check: is overlay detected?    │
│ - Call runAllDiagnostics()           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ DiagnosticsPanel renders            │
│ - Check 1: hostname (window.location)│
│ - Check 2: composer (DOM query)     │
│ - Check 3: settings (storage)       │
└──────┬──────────────────────────────┘
       │
       ├──────────────────────────────┐
       │                              │
       │ Any failed?                  │ All passed?
       │                              │
       ▼                              ▼
┌──────────────────────────┐  ┌─────────────────────────────────────┐
│ Show failed checks       │  │ Hide panel (overlay detected)      │
│ with fix buttons         │  │ Show normal settings                │
└──────────┬───────────────┘  └─────────────────────────────────────┘
           │
           │ User clicks fix
           ▼
┌─────────────────────────────────────┐
│ Execute fix action                  │
│ - Navigate to x.com                 │
│ - Enable setting toggle             │
│ - (User opens composer manually)   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Re-run diagnostics                  │
│ - chrome.storage.onChanged trigger  │
│ - Update check status to ✓         │
└─────────────────────────────────────┘
```

---

## Technical Specifications

### File Structure (v0.2.0)

```
src/
├── background/
│   └── index.ts (unchanged - minimal role)
│
├── content/
│   ├── components/
│   │   └── ScoreOverlay.tsx (MODIFIED - add pulse animation, keyboard support)
│   ├── index.tsx (MODIFIED - add diagnostics helpers, composer detection for onboarding)
│   └── styles.css (MODIFIED - add pulse animation styles)
│
├── popup/
│   ├── Popup.tsx (MODIFIED - add onboarding, diagnostics, consent guard)
│   ├── OnboardingChecklist.tsx (NEW)
│   ├── DiagnosticsPanel.tsx (NEW)
│   └── AIConsentModal.tsx (NEW)
│
├── lib/
│   ├── scoring-engine.ts (unchanged)
│   ├── ai-analysis.ts (MODIFIED - add consent wrapper export)
│   ├── runtime.ts (unchanged)
│   ├── diagnostics.ts (NEW - check functions)
│   └── consent-guard.ts (NEW - withConsent HOF)
│
├── types/
│   ├── index.ts (MODIFIED - add onboarding, consent fields)
│   └── runtime.ts (MODIFIED - add COMPOSER_DETECTED, RUN_DIAGNOSTICS)
│
└── test/
    ├── setup.ts (unchanged)
    ├── OnboardingChecklist.test.tsx (NEW)
    ├── DiagnosticsPanel.test.tsx (NEW)
    └── content/index.test.ts (NEW - detection logic)
```

### Type Definitions

**ExtensionSettings (Extended):**
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

  // NEW for v0.2.0
  onboardingCompleted?: boolean;
  aiConsentAccepted?: boolean;
  animationsEnabled?: boolean;
}
```

**RuntimeMessageTypes (Extended):**
```typescript
export type RuntimeMessageMap = {
  // Existing
  GET_SETTINGS: { payload: never; response: ExtensionSettings };
  SAVE_SETTINGS: { payload: ExtensionSettings; response: { success: true } };
  LOG_SCORE: { payload: ScoreLogEntry; response: { success: true } };

  // NEW for v0.2.0
  COMPOSER_DETECTED: { payload: never; response: { success: true } };
  RUN_DIAGNOSTICS: { payload: never; response: DiagnosticCheck[] };
  CHECK_PINNED_STATE: { payload: never; response: { pinned: boolean } };
};

export type DiagnosticCheck = {
  id: 'hostname' | 'composer' | 'settings';
  name: string;
  passed: boolean;
  message: string;
  action: string;
};
```

**Onboarding Types (NEW):**
```typescript
export type OnboardingStep = 1 | 2 | 3;

export interface OnboardingState {
  currentStep: OnboardingStep;
  steps: {
    loaded: boolean;
    pinned: boolean;
    composerDetected: boolean;
  };
  onboardingCompleted: boolean;
}
```

### Storage Schema

**chrome.storage.local Structure:**
```json
{
  "settings": {
    "enabled": true,
    "showScoreInComposer": true,
    "showScoreOnTimeline": false,
    "showSuggestions": true,
    "minScoreAlert": 50,
    "darkMode": "auto",
    "analyticsEnabled": false,
    "onboardingCompleted": false,           // NEW
    "aiConsentAccepted": false,             // NEW
    "animationsEnabled": true               // NEW
  },
  "claudeApiKey": "sk-ant-api03-...",
  "scoreHistory": [
    {
      "score": 85,
      "predictedReach": { "low": 10000, "median": 50000, "high": 100000 },
      "timestamp": 1738766400000
    }
  ]
}
```

### CSS Architecture

**Overlay Styles (Scoped to `#x-algorithm-score-overlay`):**

```css
/* Existing styles maintained */

/* Existing: Expanded state */
#x-algorithm-score-overlay .xas-card[data-expanded='true'] {
  width: 340px;
}

/* Existing: Pulse animation */
@keyframes scoreUpdate {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(29, 161, 242, 0); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(29, 161, 242, 0.08); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(29, 161, 242, 0); }
}

.score-updated {
  animation: scoreUpdate 0.3s ease;
}

/* Reduced motion support (already implemented) */
@media (prefers-reduced-motion: reduce) {
  #x-algorithm-score-overlay .xas-card {
    transition: none;
  }
  .score-updated {
    animation: none;
  }
}
```

**Popup Styles (Tailwind CSS):**

```tsx
// Use existing Tailwind classes
// Add new classes for animations (if needed)
// Example:
<div className="animate-fadeIn" />
<div className="animate-slideUp" />
```

### Performance Specifications

| Operation                | Target Latency | Implementation Notes                             |
|-------------------------|----------------|--------------------------------------------------|
| Overlay render          | <50ms          | React root already mounted, just update props    |
| Real-time scoring       | <150ms         | Debounced input (150ms) in content script        |
| Hover peek render       | <30ms          | State change → CSS width transition (180ms ease) |
| Score-change pulse      | 300ms          | CSS animation, no JS overhead                   |
| Popup open              | <100ms         | Browser-controlled, React hydration minimal      |
| Diagnostics check       | <50ms          | O(1) DOM queries, no traversal                  |
| Settings save           | <200ms         | Chrome storage async, debounced (200ms)          |

### Accessibility Specifications

**ARIA Attributes:**

| Component          | ARIA Attributes                                                                 |
|--------------------|---------------------------------------------------------------------------------|
| Popup tabs         | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-label` |
| Overlay badge      | `aria-expanded`, `aria-controls`, `aria-label`                                 |
| Overlay tabs       | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`             |
| Checkboxes         | `aria-checked`, `aria-label`                                                  |
| Modal              | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`                       |
| Focus indicators   | `:focus-visible` outline style (2px solid #1DA1F2)                             |

**Keyboard Navigation:**

| Context       | Key     | Action                                    |
|---------------|---------|-------------------------------------------|
| Popup tabs    | Tab     | Cycle through tabs                        |
| Popup tabs    | Enter   | Activate focused tab                      |
| Overlay badge | Enter   | Expand/collapse                          |
| Overlay tabs  | Tab     | Cycle through tabs in expanded overlay    |
| Overlay tabs  | Arrow   | Navigate left/right in tabs              |
| Expanded      | Escape  | Collapse overlay                          |
| Modal         | Escape  | Close modal (same as Cancel)             |

**Screen Reader Support:**
- ARIA live regions for dynamic score updates: `aria-live="polite"`
- ARIA alerts for error messages: `role="alert"`
- Descriptive labels for icons: `aria-label` or `aria-labelledby`

---

## Integration Points

### Popup ↔ Background Service Worker

**Message Flow:**

```typescript
// Popup sends message
await sendRuntimeMessage({ type: 'GET_SETTINGS' });

// Background receives and responds
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SETTINGS':
      chrome.storage.local.get('settings').then(({ settings }) => {
        sendResponse(settings || DEFAULT_SETTINGS);
      });
      return true; // Keep channel open
  }
});
```

**Storage Synchronization:**

```typescript
// Popup listens for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  const next = changes.settings?.newValue;
  if (next) {
    setSettings(next); // Update local state
  }
});
```

### Content Script ↔ Popup (Indirect)

**No Direct Communication** (same-origin policy)

**Flow:**
1. Content script detects composer → Send message to background
2. Background stores state in storage
3. Popup reads from storage or receives storage change event

**Alternative (for onboarding step 3):**

```typescript
// Content script sends message
chrome.runtime.sendMessage({ type: 'COMPOSER_DETECTED' });

// Background routes message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COMPOSER_DETECTED') {
    // Store flag or forward to active popup
    sendResponse({ success: true });
  }
});

// Popup listens via storage or runtime message
```

### Content Script → DOM

**Composer Detection:**
```typescript
// MutationObserver for composer appearance
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.querySelector(SELECTORS.composer)) {
        setupComposerListeners(composer);
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

**Overlay Injection:**
```typescript
const overlayContainer = document.createElement('div');
overlayContainer.id = 'x-algorithm-score-overlay';
document.body.appendChild(overlayContainer);

const root = createRoot(overlayContainer);
root.render(<ScoreOverlay score={score} isVisible={true} />);
```

---

## Security and Privacy

### Data Flow Privacy

| Data Type           | Storage       | External Transmission          |
|---------------------|---------------|--------------------------------|
| User settings       | Local         | None                           |
| Onboarding state    | Local         | None                           |
| AI consent flag     | Local         | None                           |
| API key             | Local         | Direct to Anthropic (user key) |
| Tweet text (score)  | None          | None (local scoring only)      |
| Tweet text (AI)     | None          | Direct to Anthropic (user key) |

### API Key Protection

- Stored in `chrome.storage.local` (encrypted at OS level)
- Never transmitted to extension servers
- User-provided, user-controlled
- Can be cleared via Settings

### Consent Guard Pattern

```typescript
export async function withConsent<T>(
  action: () => Promise<T>,
  consentKey: string = 'aiConsentAccepted'
): Promise<T> {
  const { [consentKey]: consented } = await chrome.storage.local.get(consentKey);

  if (!consented) {
    // Show modal, wait for user action
    return new Promise((resolve, reject) => {
      // Modal UI handles acceptance
      showConsentModal({
        onAccept: async () => {
          await chrome.storage.local.set({ [consentKey]: true });
          resolve(await action());
        },
        onDecline: () => {
          reject(new Error('User declined consent'));
        },
      });
    });
  }

  return action();
}
```

### No Tracking by Default

- Analytics opt-in only (`analyticsEnabled` defaults to `false`)
- Score history stored locally (max 100 entries)
- No telemetry sent to servers
- No third-party tracking scripts

---

## Error Handling

### Detection Failures

**Composer Detection Failure:**
```typescript
const composer = document.querySelector(SELECTORS.composer);
if (!composer) {
  console.error('[X Algorithm Score] Composer selector failed:', SELECTORS.composer);
  // Fallback: Try alternative selectors
  const fallback = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (fallback) {
    // Use fallback
  } else {
    // Show diagnostics error
    sendRuntimeMessage({ type: 'RUN_DIAGNOSTICS' });
  }
}
```

**Storage Access Failure:**
```typescript
try {
  const settings = await sendRuntimeMessage({ type: 'GET_SETTINGS' });
} catch (error) {
  console.error('[X Algorithm Score] Failed to load settings:', error);
  setSettings(DEFAULT_SETTINGS); // Fallback
}
```

### API Errors

**AI API Error:**
```typescript
const result = await analyzeWithClaude(text);
if (isAIError(result)) {
  setAiError(result.error);
  // User-friendly error messages
  if (result.code === 'NO_API_KEY') {
    setAiError('No API key configured. Add your Claude API key in extension settings.');
  } else if (result.code === 'RATE_LIMITED') {
    setAiError('Rate limited. Please try again in a moment.');
  }
}
```

### User-Facing Error Messages

| Error Type                  | Message                                                                 |
|-----------------------------|-------------------------------------------------------------------------|
| Not on x.com                | "X Algorithm Score only works on x.com. Please navigate to x.com."      |
| Composer not open           | "No tweet composer detected. Click the 'Post' button to compose."       |
| Extension disabled          | "Overlay is disabled. Enable 'Show score while composing' in Settings." |
| Overlay initialization error | "Overlay failed to initialize. Try refreshing the page."                |
| AI no API key               | "No API key configured. Add your Claude API key in extension settings." |
| AI rate limited             | "Rate limited. Please try again in a moment."                             |
| AI API error                | "Analysis failed. Please check your API key and try again."             |

---

## Testing Strategy

### Unit Tests (Vitest)

**Detection Logic:**
```typescript
// src/content/index.test.ts
describe('Composer Detection', () => {
  test('detectComposer returns true when composer DOM exists', () => {
    document.body.innerHTML = '<div data-testid="tweetTextarea_0"></div>';
    expect(detectComposer()).toBe(true);
  });

  test('detectComposer returns false when composer DOM missing', () => {
    document.body.innerHTML = '';
    expect(detectComposer()).toBe(false);
  });

  test('detectHostname returns true for x.com', () => {
    Object.defineProperty(window, 'location', { value: { hostname: 'x.com' } });
    expect(checkHostname().passed).toBe(true);
  });
});
```

**Diagnostics Panel:**
```typescript
// src/popup/DiagnosticsPanel.test.tsx
describe('DiagnosticsPanel', () => {
  test('shows all 3 checks with correct status', () => {
    const checks: DiagnosticCheck[] = [
      { id: 'hostname', name: 'On x.com', passed: true, message: 'On x.com', action: '' },
      { id: 'composer', name: 'Composer open', passed: false, message: 'Not open', action: 'Click Post' },
      { id: 'settings', name: 'Extension enabled', passed: true, message: 'Enabled', action: '' },
    ];
    render(<DiagnosticsPanel checks={checks} />);
    expect(screen.getByText('On x.com')).toBeInTheDocument();
    expect(screen.getByText('Composer open')).toBeInTheDocument();
  });

  test('updates checks when conditions change', () => {
    const { rerender } = render(<DiagnosticsPanel checks={initialChecks} />);
    const updatedChecks = initialChecks.map(c => ({ ...c, passed: true }));
    rerender(<DiagnosticsPanel checks={updatedChecks} />);
    expect(screen.getAllByRole('img', { name: 'check' })).toHaveLength(3);
  });
});
```

**Consent Guard:**
```typescript
// src/lib/consent-guard.test.ts
describe('withConsent', () => {
  test('shows modal when consent not accepted', async () => {
    await chrome.storage.local.set({ aiConsentAccepted: false });
    const action = jest.fn().mockResolvedValue('result');
    const result = await withConsent(action);
    // Mock modal UI would be shown
  });

  test('stores consent and proceeds when accepted', async () => {
    await chrome.storage.local.set({ aiConsentAccepted: false });
    // Simulate user clicking "I understand"
    const consented = await chrome.storage.local.get('aiConsentAccepted');
    expect(consented.aiConsentAccepted).toBe(true);
  });
});
```

### Integration Tests (Manual E2E)

**Onboarding Flow:**
1. Install extension fresh
2. Open popup → See checklist
3. Step 1 auto-checks ✓
4. Pin extension → Step 2 checks ✓
5. Navigate to x.com → Click compose → Step 3 checks ✓
6. Reopen popup → See tabs (not checklist)

**Diagnostics Flow:**
1. Open popup on non-X site → See diagnostics
2. Check 1: ✗ "Not on x.com"
3. Navigate to x.com → Check 1 becomes ✓
4. Check 2: ✗ "Composer not open"
5. Click Post → Check 2 becomes ✓
6. All checks pass → Panel hides

**AI Consent Flow:**
1. Enter test text → Click "Analyze with Claude"
2. See consent modal
3. Click "I understand" → See analysis results
4. Click "Analyze" again → Proceeds directly (no modal)

### Accessibility Tests

**Keyboard Navigation:**
- Tab through popup tabs → Verify focus visible
- Tab through expanded overlay → Verify order and Escape
- Use screen reader (NVDA/JAWS) → Verify announcements

**Motion Preferences:**
- Enable `prefers-reduced-motion` in OS settings
- Type in composer → Verify no pulse animation
- Hover over badge → Verify smooth transition (no animation)

---

## Migration and Deployment

### Version Migration

**v0.1.0 → v0.2.0:**

```typescript
// src/background/index.ts - install handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    const { settings } = await chrome.storage.local.get('settings');
    if (settings) {
      // Add new fields with defaults
      const migrated = {
        ...settings,
        onboardingCompleted: settings.onboardingCompleted ?? false,
        aiConsentAccepted: settings.aiConsentAccepted ?? false,
        animationsEnabled: settings.animationsEnabled ?? true,
      };
      await chrome.storage.local.set({ settings: migrated });
    }
  }
});
```

### Build Process

**Package Updates:**
```bash
npm run build
```

**Output:**
- `dist/` folder with all assets
- `manifest.json` (generated by CRXJS)
- Content scripts, popup, background worker bundled

### Chrome Web Store Submission

**Pre-Submission Checklist:**
- [ ] Update `manifest.json` version to `0.2.0`
- [ ] Update `package.json` version to `0.2.0`
- [ ] Run `npm run check` (type-check + lint + test)
- [ ] Load `dist/` in Chrome (Load Unpacked) → Test all P0 features
- [ ] Update `PRIVACY_POLICY.md` with AI API usage
- [ ] Verify permissions: Only `storage` (no new permissions)

**Store Listing:**
- Title: "X Algorithm Score"
- Description: "Score your tweets before posting based on X's actual recommendation algorithm."
- Privacy Policy: Link to repository
- Category: "Productivity"

---

## Known Limitations and Mitigations

### Limitation 1: Pinned State Detection

**Issue:** Chrome API may not expose extension pinned state to content scripts.

**Mitigation:**
```typescript
// Try API, fallback to manual checkbox
async function detectPinnedState(): Promise<boolean> {
  try {
    // Attempt Chrome API (may not be available)
    const result = await sendRuntimeMessage({ type: 'CHECK_PINNED_STATE' });
    return result.pinned;
  } catch {
    // Fallback: Manual checkbox in onboarding
    return false;
  }
}
```

**UI:**
- Manual checkbox: "I have pinned the extension"
- User clicks → Step 2 checks

### Limitation 2: X.com DOM Selector Changes

**Issue:** X.com DOM changes frequently may break composer detection.

**Mitigation:**
- Maintain selector constants in one location
- Add fallback selectors
- Log errors to console
- Show diagnostics error with "Report Issue" link

```typescript
const SELECTORS = {
  composer: '[data-testid="tweetTextarea_0"]',
  composerFallback: '[data-testid="tweetText_0"]',
  composerAlt: 'div[role="textbox"]',
};

function findComposer(): Element | null {
  return (
    document.querySelector(SELECTORS.composer) ||
    document.querySelector(SELECTORS.composerFallback) ||
    document.querySelector(SELECTORS.composerAlt)
  );
}
```

### Limitation 3: Content Script Performance

**Issue:** MutationObserver on large X.com pages may impact performance.

**Mitigation:**
- Throttle observer callbacks (100ms debounce)
- Disconnect observer when composer closes
- Limit subtree depth

```typescript
const observer = new MutationObserver(
  debounce((mutations) => {
    // Handle mutations
  }, 100)
);

observer.observe(document.body, {
  childList: true,
  subtree: true,
  // Limit observation depth if needed
});
```

---

## Future Considerations

### v0.3.0 Roadmap Alignment

The v0.2.0 architecture provides foundation for:

1. **Score History Tracking** (v0.3.0)
   - Already has `scoreHistory` storage structure
   - Ready for UI enhancements

2. **Timeline Tweet Scoring** (v0.3.0)
   - Content script architecture supports multiple composers
   - Can extend to timeline tweets

3. **User Context Integration** (v0.3.0)
   - Storage schema ready for user profile data
   - Scoring engine can consume user context

### Scalability Considerations

**Score History:**
- Currently limited to 100 entries (local storage quota)
- Future: IndexedDB for larger history

**Multiple Composers:**
- Currently supports single composer
- Future: Support multiple composers (replies, quote tweets)

**Offline Mode:**
- Currently requires internet for AI analysis
- Future: Cache AI responses locally

---

## Conclusion

This architecture defines a maintainable, extensible foundation for X Algorithm Score v0.2.0. By leveraging existing codebase structure and adding minimal new components, we deliver premium UX improvements while maintaining privacy-first principles and Chrome Web Store compliance.

**Key Architectural Decisions:**
- **No New Permissions:** Store-friendly review process
- **Privacy-First:** All data local, user-controlled
- **Component-Based:** Reusable, testable components
- **Type-Safe:** Full TypeScript coverage
- **Accessibility-First:** Keyboard navigation from day one

**Next Steps:**
1. Review and approve architecture
2. Break down into epics and stories
3. Begin implementation following this design
4. Run validation workflow after implementation

---

**Document Version:** 1.0
**Last Updated:** 2026-02-05
**Next Review:** Post-implementation (v0.2.0 release)
