# UX/UI Brainstorm: Onboarding & Install Experience
**Role:** Sally (🎨 UX Designer)  
**Focus:** First-run onboarding + download/install polish  
**Date:** 2026-02-05

---

## Primary User Journey: First-Time Install → First Score

### Happy Path (60 seconds)
1. **Download** → GitHub Releases zip → Extract `dist/`
2. **Load** → `chrome://extensions/` → Developer mode → Load unpacked → Select `dist/`
3. **Pin** → Puzzle icon → Pin "X Algorithm Score"
4. **Navigate** → Go to `x.com` → Click compose
5. **Type** → Overlay appears bottom-right → Score updates in real-time
6. **Explore** → Click badge → Expand breakdown → See suggestions

### Friction Points (Current)
- **No post-install guidance** → User must remember to pin + navigate + compose
- **Silent failures** → Overlay missing = no feedback (user assumes broken)
- **Settings discovery** → Hidden in popup → No contextual help
- **Install friction** → Multiple steps, no visual confirmation

---

## Alternative Onboarding Patterns

### Pattern A: Checklist-in-Popup (Recommended)
**When:** First popup open after install  
**Where:** Popup → New "Welcome" tab (or overlay banner)

**Flow:**
1. Detect first-run (`chrome.storage.local.get('onboardingCompleted')`)
2. Show welcome tab with 3-step checklist:
   ```
   ✓ Extension loaded
   ⬜ Pin extension (puzzle icon → pin)
   ⬜ Go to x.com and compose
   ```
3. Auto-detect completion:
   - Pin detection: Check if extension icon visible in toolbar (via `chrome.action.getBadgeText` or user interaction)
   - Compose detection: Content script detects composer open → Send message to popup
4. On completion → Show "🎉 You're all set!" → Auto-switch to Test tab → Offer quick test

**Microcopy:**
- **Welcome header:** "Welcome to X Algorithm Score"
- **Subheader:** "Get real-time feedback on your tweets in 3 steps"
- **Step 1 (auto-checked):** "✓ Extension loaded successfully"
- **Step 2:** "Pin the extension (click puzzle icon → pin X Algorithm Score)"
- **Step 3:** "Go to x.com and compose a tweet"
- **Completion:** "🎉 Ready! Start typing to see your score."

**Visual:** Progress indicator (1/3, 2/3, 3/3), checkmarks animate on completion

---

### Pattern B: Contextual Coachmarks (Alternative)
**When:** First composer open after install  
**Where:** Overlay badge with pulsing animation + tooltip

**Flow:**
1. First composer open → Overlay appears with pulsing glow
2. Tooltip: "👋 Start typing to see your algorithm score"
3. After first score → Tooltip changes: "Click to expand details"
4. After first expand → Tooltip disappears (onboarding complete)

**Microcopy:**
- **Initial:** "👋 Start typing to see your algorithm score"
- **After score:** "Click to expand breakdown and suggestions"
- **After expand:** (tooltip disappears)

**Visual:** Subtle pulse animation (2-3 pulses), tooltip dismisses on interaction

---

### Pattern C: Diagnostics Mode (Error Recovery)
**When:** Overlay not detected after 10 seconds on x.com  
**Where:** Popup → Settings tab → "Diagnostics" section

**Flow:**
1. User opens popup → Settings tab
2. If overlay not detected → Show diagnostics panel:
   ```
   🔍 Diagnostics
   
   Extension enabled: ✓
   Show score while composing: ✓
   On x.com: ✓
   Composer detected: ✗
   
   → Try refreshing the page
   → Make sure you've clicked "Compose"
   ```
3. Auto-run diagnostics on popup open (check all conditions)
4. Show actionable fixes per failure

**Microcopy:**
- **Panel title:** "🔍 Diagnostics"
- **Status labels:** "Extension enabled", "Show score while composing", "On x.com", "Composer detected"
- **Success:** "✓" (green)
- **Failure:** "✗" (red) + action below
- **Actions:**
  - "Extension disabled" → "Enable extension toggle above"
  - "Show score disabled" → "Enable 'Show score while composing' toggle above"
  - "Not on x.com" → "Navigate to x.com or twitter.com"
  - "Composer not detected" → "Click 'Compose' button to open tweet composer"

**Visual:** Status indicators (✓/✗), grouped by category, expandable details

---

## Microcopy: Key States & Errors

### Empty States

**Overlay (no text):**
- Current: "Start typing to score"
- **Better:** "Start typing to see your score" (clearer CTA)

**Popup Test tab (empty):**
- Current: "Enter a tweet to see its algorithm score"
- **Better:** "Type a tweet below to see its algorithm score" (more directive)

**History tab (empty):**
- Current: "No score history yet."
- **Better:** "No score history yet. Scores are saved when you post (if Analytics is enabled)." (explains why empty)

---

### Error States

**Overlay not showing:**
- **In popup (Settings):** "Overlay not detected. Check: (1) Extension enabled, (2) Show score while composing enabled, (3) On x.com, (4) Composer open"
- **In overlay (if visible but broken):** "Score unavailable. Check Settings → Enable extension"

**Permissions:**
- **Missing storage:** "Settings unavailable. Please reload the extension."
- **Missing activeTab:** "Cannot access page. Check extension permissions."

**Not on x.com:**
- **Popup (any tab):** Banner: "⚠️ Navigate to x.com to see scores while composing"
- **Test tab:** "Note: This tab works anywhere. The overlay only appears on x.com."

**Compose not open:**
- **Overlay (if visible):** "Open the composer to see your score"
- **Popup:** "Composer not detected. Click 'Compose' on x.com to start."

**AI key missing:**
- **Test tab (AI button):** "Add your Claude API key in Settings to enable AI analysis"
- **Settings (AI section):** "Optional: Add your Claude API key for deep analysis. Get one at console.anthropic.com"

**AI call privacy notice:**
- **Before first AI call:** Modal/info box:
  ```
  🤖 AI Analysis Privacy Notice
  
  When you click "Deep Analysis with AI", your draft tweet text will be sent to Anthropic's Claude API using your API key.
  
  ✓ Your API key is stored locally
  ✓ Only the draft text is sent (no metadata)
  ✓ You control when analysis runs
  
  [I understand] [Cancel]
  ```
- **After acceptance:** Store `aiPrivacyAccepted: true` → Don't show again

---

## Visual & Interaction Recommendations

### Popup Hierarchy

**Current structure:** Header → Tabs → Content  
**Improvements:**

1. **Header:**
   - Keep icon + title + tagline
   - Add subtle badge: "v0.1.0" (small, muted)
   - Add "?" icon → Opens help/onboarding

2. **Tabs:**
   - Current: Emoji + text (📝 Test, 📚 Learn, etc.)
   - **Better:** Keep emoji, add subtle active indicator (underline + color)
   - **Accessibility:** Ensure keyboard navigation (Arrow keys), focus visible

3. **Content spacing:**
   - Current: `padding: 16px`
   - **Better:** Consistent 16px padding, 12px gap between sections
   - **Typography:** 14px body, 13px labels, 12px hints

---

### Overlay Visual Design

**Current:** Bottom-right fixed, grade circle + expandable card  
**Improvements:**

1. **Grade presentation:**
   - Current: Large circle with grade letter
   - **Better:** 
     - Collapsed: Grade letter (64px circle) + subtle pulse on score change
     - Expanded: Grade letter + score number (e.g., "S 92/100") + grade label ("Excellent")
   - **Color coding:** Maintain current (S=green, A=lime, B=yellow, C=orange, D/F=red)

2. **Progressive disclosure:**
   - Current: Click to expand → Shows tabs
   - **Better:**
     - Hover: Show peek (top suggestion + score)
     - Click: Expand full card
     - Escape: Collapse
   - **Animation:** Smooth expand/collapse (200ms ease-out)

3. **Score pulse:**
   - Current: `scorePulse` state (320ms)
   - **Better:** Subtle scale animation (1.0 → 1.05 → 1.0) + color flash (current color → brighter → current)

4. **Spacing:**
   - Current: Inline styles
   - **Better:** CSS variables for consistent spacing:
     ```css
     --xas-spacing-xs: 4px;
     --xas-spacing-sm: 8px;
     --xas-spacing-md: 12px;
     --xas-spacing-lg: 16px;
     ```

---

### Typography

**Current:** System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)  
**Recommendations:**

1. **Hierarchy:**
   - **H1 (popup title):** 16px, weight 600
   - **H2 (section titles):** 14px, weight 600
   - **Body:** 13px, weight 400
   - **Small text (hints):** 11px, weight 400
   - **Grade display:** 24px, weight 700 (bold)

2. **Line height:** 1.4 for body, 1.2 for headings

3. **Color contrast:**
   - **Primary text:** `#E7E9EA` (WCAG AA)
   - **Secondary text:** `#8899A6` (muted)
   - **Error text:** `#FCA5A5` (red tint)

---

### Score Presentation

**Current:** Grade letter + overall score + predicted reach  
**Improvements:**

1. **Grade display:**
   - Collapsed: Large grade letter (S/A/B/C/D/F) in colored circle
   - Expanded: Grade letter + score number + label ("S 92/100 - Excellent")

2. **Predicted reach:**
   - Current: "Predicted reach: X - Y impressions"
   - **Better:** "Predicted: X - Y impressions" (shorter)
   - **Visual:** Add icon (📊) or chart sparkline (future)

3. **Breakdown bars:**
   - Current: Horizontal bars with colors
   - **Better:** Add percentage labels (e.g., "Content: 20/25 (80%)")
   - **Animation:** Animate bar fill on score change (300ms ease-out)

---

## Accessibility Notes

### Keyboard Navigation

**Popup:**
- Tab order: Header → Tabs (Arrow keys) → Content (Tab)
- Focus visible: 2px blue outline (`#1DA1F2`)
- Escape: Close popup (if Chrome allows)

**Overlay:**
- Current: Escape collapses expanded overlay ✓
- **Add:** Tab navigation within expanded overlay (tabs → content → footer)
- **Add:** Enter/Space on header button toggles expand

**Settings:**
- Toggles: Space/Enter to toggle
- Range inputs: Arrow keys adjust value
- API key input: Standard text input behavior

---

### Reduced Motion

**Current:** Animations (pulse, expand)  
**Recommendations:**

1. **Respect `prefers-reduced-motion`:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

2. **Disable pulse animations** when reduced motion enabled

3. **Keep essential transitions** (expand/collapse) but make instant if motion reduced

---

### Screen Readers

**Current:** Some ARIA labels (`aria-expanded`, `aria-controls`)  
**Improvements:**

1. **Overlay header button:**
   - Current: `aria-label` with dynamic text
   - **Better:** More descriptive: "Score overlay: {grade} grade, {score}/100, {label}. Click to expand details."

2. **Tabs:**
   - Current: `role="tablist"`, `role="tab"`, `aria-selected`
   - **Better:** Add `aria-label` to tablist: "Score details tabs"

3. **Score breakdown:**
   - Add `aria-label` to bars: "Content score: 20 out of 25 points"

4. **Suggestions:**
   - Add `role="list"` to suggestions container
   - Add `role="listitem"` to each suggestion

---

## Performance Notes

### Avoid Heavy Per-Keystroke Work

**Current:** Debounced input handler (150ms)  
**Recommendations:**

1. **Debounce timing:**
   - Current: 150ms
   - **Better:** 200ms (slightly longer to reduce CPU usage)
   - **Consider:** Increase to 300ms if scoring becomes heavy

2. **Scoring optimization:**
   - Current: `scoreTweet()` runs on every debounced input
   - **Better:** Cache results if text unchanged (rare, but good practice)
   - **Future:** Web Worker for scoring (if scoring becomes CPU-intensive)

3. **Overlay rendering:**
   - Current: React re-renders on every score change
   - **Better:** Use `React.memo` for `ScoreOverlay` component
   - **Better:** Only update changed parts (score number, grade, suggestions)

4. **Media detection:**
   - Current: Runs on every input (via MutationObserver)
   - **Better:** Throttle media detection (500ms) since media changes are infrequent

---

### Initial Load Performance

**Current:** Content script loads on page load  
**Recommendations:**

1. **Lazy load overlay:**
   - Don't create overlay until composer detected
   - Reduces initial DOM manipulation

2. **Settings loading:**
   - Current: Loads settings on init
   - **Better:** Cache settings in content script (update on storage change)

3. **Bundle size:**
   - Current: React + scoring engine
   - **Monitor:** Keep bundle < 100KB (gzipped) for fast load

---

## Prioritized Improvements (P0/P1/P2)

### P0: Critical for First-Run Success

1. **✅ Checklist-in-Popup onboarding**
   - Detect first-run → Show welcome checklist
   - Auto-detect pin + compose completion
   - **Impact:** Reduces support requests, improves activation rate

2. **✅ Diagnostics mode in Settings**
   - Auto-run diagnostics on popup open
   - Show actionable fixes for overlay not showing
   - **Impact:** Self-service troubleshooting

3. **✅ Improved error microcopy**
   - Clear messages for overlay not showing, permissions, AI key missing
   - **Impact:** Reduces confusion

4. **✅ AI privacy notice**
   - Modal before first AI call
   - Store acceptance → Don't show again
   - **Impact:** Transparency, compliance

---

### P1: Premium Polish

5. **✅ Overlay hover peek**
   - Show top suggestion + score on hover (before click)
   - **Impact:** Better discoverability, faster feedback

6. **✅ Score pulse animation**
   - Subtle scale + color flash on score change
   - Respect `prefers-reduced-motion`
   - **Impact:** Delightful feedback

7. **✅ Keyboard navigation**
   - Full keyboard support (Tab, Arrow keys, Escape)
   - Focus visible indicators
   - **Impact:** Accessibility, power users

8. **✅ Typography polish**
   - Consistent spacing, line heights, color contrast
   - **Impact:** Professional appearance

9. **✅ Breakdown bar animations**
   - Animate bar fill on score change
   - Add percentage labels
   - **Impact:** Visual feedback, clarity

---

### P2: Nice-to-Have

10. **Empty state improvements**
    - Better microcopy for empty states (Test, History)
    - **Impact:** Clarity

11. **Screen reader improvements**
    - More descriptive ARIA labels
    - **Impact:** Accessibility

12. **Performance optimizations**
    - React.memo, Web Worker (if needed)
    - **Impact:** Smooth experience on low-end devices

13. **Visual polish**
    - CSS variables for spacing
    - Consistent border radius, shadows
    - **Impact:** Cohesive design

14. **Install experience**
    - Post-install notification: "Extension installed! Click to get started"
    - **Impact:** Better activation (requires Chrome API)

---

## Download/Install Experience Recommendations

### GitHub Release Page

**Current:** Standard GitHub release  
**Recommendations:**

1. **Release notes:**
   - Include visual guide (screenshots/GIFs)
   - Link to INSTALL.md
   - **Example:**
     ```
     ## Installation (60 seconds)
     
     1. Download `x-algorithm-score-v0.1.0.zip`
     2. Extract → You'll see a `dist/` folder
     3. Chrome → `chrome://extensions/` → Developer mode → Load unpacked → Select `dist/`
     4. Pin extension → Go to x.com → Compose → See your score!
     
     [📖 Full Installation Guide](INSTALL.md)
     ```

2. **Assets:**
   - Add `install-guide.png` (visual step-by-step)
   - Add `demo.gif` (overlay in action)

---

### INSTALL.md Improvements

**Current:** Text-based guide  
**Recommendations:**

1. **Add visual indicators:**
   - Screenshots for each step (Chrome extensions page, Load unpacked dialog)
   - Annotated images (arrows pointing to buttons)

2. **Troubleshooting section:**
   - Expand current troubleshooting
   - Add "Common issues" with solutions
   - **Example:**
     ```
     ### Overlay not showing?
     
     Run diagnostics:
     1. Open extension popup
     2. Go to Settings tab
     3. Check "Diagnostics" section
     4. Follow suggested fixes
     ```

3. **First-run checklist:**
   - Prominent "First-run checklist" section
   - Link to popup onboarding (if implemented)

---

### Post-Install Flow

**Current:** No post-install guidance  
**Recommendations:**

1. **Chrome notification (if possible):**
   - "X Algorithm Score installed! Click to get started"
   - Opens popup → Shows onboarding checklist

2. **Extension badge (if possible):**
   - Show badge "1" on install
   - Click → Opens popup → Shows onboarding

3. **Popup first-open:**
   - Detect first-run → Show welcome tab
   - Auto-complete step 1 (extension loaded)
   - Guide through pin + compose

---

## Summary

**Key Takeaways:**

1. **Onboarding:** Checklist-in-popup (Pattern A) is highest impact → Auto-detect completion → Reduces friction
2. **Error recovery:** Diagnostics mode (Pattern C) → Self-service troubleshooting → Reduces support
3. **Microcopy:** Clear, actionable messages → Reduces confusion
4. **Visual polish:** Consistent spacing, typography, animations → Premium feel
5. **Accessibility:** Keyboard nav, screen readers, reduced motion → Inclusive design
6. **Performance:** Debounce, memoization, lazy loading → Smooth experience

**Next Steps:**
1. Implement P0 items (checklist onboarding, diagnostics, error microcopy, AI privacy)
2. Test with real users (first-time installers)
3. Iterate based on feedback
4. Add P1 polish items
5. Monitor performance metrics (activation rate, support requests)

---

**Document Status:** Ready for implementation  
**Estimated P0 Effort:** 2-3 days  
**Estimated P1 Effort:** 3-4 days  
**Estimated P2 Effort:** 2-3 days
