# X Algorithm Score — Project Status

Last updated: February 2026

## What's Built

### Core Extension (MVP)
- **Real-time tweet scoring** on x.com — content script detects the composer via MutationObserver and displays a floating score badge (0-100, S-F grade)
- **5-component scoring engine** — Content (0-25), Media (0-20), Timing (0-15), Engagement (0-20), Risk penalty (0-30), normalized to 0-100
- **3-tab popup** — Test (score drafts offline), Learn (8 algorithm insight cards), Settings (API key, preferences)
- **Score overlay** — collapsible badge expands to show Suggestions, Breakdown, and Algorithm Factors tabs
- **Claude AI deep analysis** — optional originality scoring, engagement prediction, rewrite suggestions via user's own API key
- **Background service worker** — handles install/update, message routing, score history storage, badge updates

### Controversy Risk Scanner (New)
`src/lib/scandal-detector.ts` — pattern-based detection for content likely to trigger catastrophic algorithmic penalties.

**6 detection categories:**
| Category | Examples | Why It Matters |
|----------|----------|----------------|
| Offensive language | Insults, violent language, slurs | Reports = -369x multiplier |
| Hot-button topics | Broad group generalizations, political polarization | Mass reports from targeted group |
| Inflammatory tone | Personal attacks, excessive caps, confrontational language | Blocks/mutes = -74x each |
| Rage bait | "cope harder", "stay mad", intentional provocation | Blocks far outweigh any reply boost |
| Targeted attacks | Attacking named users, doxxing references, cancel calls | Mass reports + potential suspension |
| Misinformation patterns | Conspiracy framing, false authority claims, JAQ-ing | Content moderation flags |

**4 severity levels:** low (2pt penalty), medium (5pt), high (10pt), critical (20pt)
**4 risk levels:** safe / caution / risky / dangerous

**Integration:**
- Penalty feeds into scoring engine's risk calculation (capped at 10pts of 30pt risk budget)
- Top controversy warning surfaces in the suggestions list
- Popup shows color-coded risk banner with icon, level label, and warning details
- Overlay shows compact controversy alert strip in expanded view

### Thread Length Detection (Bug Fix)
Content script now counts `tweetTextarea_N` elements to detect thread length instead of hardcoding `threadLength: 1`. X uses `tweetTextarea_0`, `tweetTextarea_1`, etc. for each tweet in a thread.

### Other Fixes & Cleanup
- Removed unused dependencies (`lucide-react`, `zustand`) — declared but never imported
- Removed all TODO comments from source (0 remaining)
- Removed stale follower-timezone dead code block from timing calculator
- Fixed broken placeholder screenshot references in README
- Comprehensive README rewrite with install guide, scoring tables, project structure

### Build & Packaging
- `npm run build` — tsc + vite build (40 modules, ~460ms)
- `npm run build:clean` — removes dist/ first
- `npm run package` — clean build + zip for Chrome Web Store (129KB)
- TypeScript strict mode, 0 errors
- Manifest V3 validated, all file references verified

## What Remains

### High Priority (Before CWS Submission)
- [ ] Load extension in Chrome and verify it works on x.com
- [ ] Take 5 screenshots for Chrome Web Store listing (see `store-assets/STORE_LISTING.md`)
- [ ] Fill in store listing placeholders (support email, website URL, GitHub repo)
- [ ] Host privacy policy at a public URL
- [ ] Submit to Chrome Web Store

### Medium Priority
- [ ] Upgrade Vite to 6.x when @crxjs/vite-plugin supports it (fixes esbuild dev server vulnerability — moderate severity, dev-only)
- [ ] Persist settings changes to chrome.storage (popup Settings tab currently local state only)
- [ ] Add score history tracking (background service worker has the handler, needs UI)

### Low Priority (Post-MVP)
- [ ] Timeline scoring — show scores on existing tweets in the feed
- [ ] User context integration — follower count, engagement rate, Premium status
- [ ] Thread composer — per-tweet scoring within threads
- [ ] Optimal posting time — personalized suggestions based on follower timezones
- [ ] Firefox and Safari support
- [ ] A/B testing suggestions

## File Map

```
src/
├── background/index.ts           # Service worker (install, messaging, history)
├── content/
│   ├── index.tsx                 # Composer detection, overlay injection
│   ├── styles.css                # Overlay animations
│   └── components/
│       └── ScoreOverlay.tsx      # Collapsible score badge + expanded panel
├── lib/
│   ├── scoring-engine.ts         # 5-component scoring + suggestions + factors
│   ├── scandal-detector.ts       # Controversy risk scanner (6 categories)
│   └── ai-analysis.ts            # Claude API integration
├── popup/
│   ├── index.html                # Popup entry
│   ├── main.tsx                  # React mount
│   ├── Popup.tsx                 # 3-tab UI (Test, Learn, Settings)
│   └── styles.css                # Tailwind + custom styles
└── types/index.ts                # All interfaces + default weights
```

## Commit History

```
b53e2c9 feat: add Controversy Risk Scanner for tweet analysis
c8b1aa8 docs: rewrite README with full install/dev/usage guide
de1f1ef docs: update README with packaging commands and fix broken screenshot refs
79e5495 chore: add CWS packaging scripts and ignore zip artifacts
494550f chore: extension session updates
207284c docs: add INSTALL.md and sync version to 0.1.0
6200742 docs: comprehensive README with installation guide and algorithm insights
063a2c7 feat: initial MVP release of X Algorithm Score extension
```
