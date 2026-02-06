# X Algorithm Score

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/affaan-m/x-algorithm-score/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest_V3-yellow.svg)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A Chrome extension that scores your tweets **before you post them**, based on X's open-sourced recommendation algorithm. Get a 0-100 score, letter grade (S through F), actionable suggestions, and predicted reach — all in real time as you type.

---

## Features

### On-Page Scoring (Content Script)
- **Live score overlay** on x.com — a floating badge appears while you compose tweets
- **Click to expand** into a full panel with three tabs: Suggestions, Breakdown, Algorithm Factors
- **Auto-detects** attached media (images, video, GIFs, polls) and adjusts score accordingly
- **Reply/quote detection** — knows when you're replying vs. posting fresh

### Popup (Toolbar Icon)
- **Test tab** — score any tweet text offline without navigating to x.com
- **Learn tab** — 8 algorithm insight cards covering reply value (75x!), video boost, link penalties, dwell time, and more
- **Settings tab** — configure Claude API key for AI analysis, toggle overlay, set score alert threshold

### Scoring Engine
- **5-component breakdown**: Content (0-25), Media (0-20), Timing (0-15), Engagement (0-20), Risk (0-30 penalty)
- **Template detection** — flags overused formats ("gm", "unpopular opinion", "day X of...")
- **Sentiment analysis** — lightweight pattern matching since Grok AI scores tone
- **Link penalty modeling** — separate calculations for Premium vs. non-Premium accounts

### AI-Powered Deep Analysis (Optional)
- **Originality scoring** with template pattern detection
- **Engagement prediction** — reply likelihood and viral potential with reasoning
- **Rewrite suggestions** — improved versions of your tweet with explanations
- **Audience analysis** — who your tweet appeals to and how to better target
- Powered by Claude API (requires your own API key, stored locally)

---

## Screenshots

> Load the extension and visit x.com to see the UI in action.

| View | Description |
|------|-------------|
| **Score Badge** | Floating circle in the bottom-right corner showing your grade (S/A/B/C/D/F) while composing |
| **Expanded Overlay** | Click the badge to see suggestions, score breakdown bars, and algorithm factor cards |
| **Popup — Test** | Type any tweet text, see instant score with grade circle, suggestions, and optional AI analysis |
| **Popup — Learn** | 8 cards covering key algorithm insights: reply multipliers, video boost, link penalties, timing |
| **Popup — Settings** | Claude API key input, overlay toggle, suggestion toggle, minimum score alert slider |

To capture screenshots for the Chrome Web Store, see `store-assets/STORE_LISTING.md`.

---

## Installation

### For Users: Load as Unpacked Extension

1. Download or clone this repository
2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in the top-right corner)
5. Click **Load unpacked**
6. Select the `dist/` folder inside this project
7. The **XS** icon appears in your toolbar — navigate to [x.com](https://x.com) and start composing

> **Tip**: After code changes, run `npm run build` again, then click the reload button (circular arrow) on the extension card in `chrome://extensions/`.

### For Developers: Development Mode

```bash
git clone https://github.com/affaan-m/x-algorithm-score.git
cd x-algorithm-score

npm install

# Start dev server with hot module replacement
npm run dev
```

Then load `dist/` as an unpacked extension (steps 3-6 above). CRXJS provides HMR so most changes reflect without a manual reload.

### Package for Chrome Web Store

```bash
npm run package
# Outputs: x-algorithm-score.zip (clean build, ready for CWS upload)
```

---

## Usage

### On x.com

1. Go to [x.com](https://x.com) and open the tweet composer
2. A **score badge** appears in the bottom-right corner as you type
3. Click the badge to expand — see Suggestions, Breakdown, and Algorithm Factors tabs
4. The score updates in real time with 150ms debounce
5. Attach media, add questions, or remove links and watch your score change

### In the Popup

Click the toolbar icon (**XS**) to open the popup without leaving your current page:

| Tab | What It Does |
|-----|--------------|
| **Test** | Paste or type a draft tweet, toggle "has media", see score + suggestions. Click "Deep Analysis with AI" for Claude-powered feedback. |
| **Learn** | Browse 8 algorithm insight cards based on `twitter/the-algorithm` code analysis and community research. |
| **Settings** | Enter Claude API key (stored in `chrome.storage.local`), toggle composer overlay, configure alert threshold. |

---

## Score Breakdown

### Grading Scale

| Grade | Score | Meaning |
|-------|-------|---------|
| **S** | 90-100 | Excellent — optimized for maximum reach |
| **A** | 80-89 | Great — strong algorithm signals |
| **B** | 65-79 | Good — room for improvement |
| **C** | 50-64 | Fair — missing key optimizations |
| **D** | 35-49 | Poor — significant issues detected |
| **F** | 0-34 | Needs work — major problems |

### Scoring Components

| Component | Max | What It Measures |
|-----------|-----|------------------|
| Content | 25 | Length (sweet spot: 120-240 chars), threads, emojis, structure |
| Media | 20 | Video (+20), images (+17), GIFs (+16), polls (+18), none (+0) |
| Timing | 15 | Peak hours (9am-12pm, 7pm-10pm EST), weekday bonus |
| Engagement | 20 | Questions (+8), CTAs (+4), quote tweets (+3), replies (+2) |
| Risk | -30 | External links (-15/-20), excess hashtags (-3 each), excess mentions (-2 each), templates (-5), negative sentiment (-3) |

---

## Algorithm Research

Scoring is based on [twitter/the-algorithm](https://github.com/twitter/the-algorithm) (home-mixer, heavy-ranker, SimClusters) plus community research.

### Key Multipliers from Algorithm Code

| Signal | Multiplier | Why It Matters |
|--------|------------|----------------|
| Reply-to-reply | **75x** | You responding to comments is the single highest-value action |
| Direct replies | **13.5-27x** | Conversation signals dominate the ranking |
| Quote tweets | **> retweets** | Commentary adds value over simple amplification |
| Retweets | **1-2x** | Basic amplification, lowest positive signal |
| Likes | **0.5x** | Lowest engagement value in the algorithm |
| Reports | **-369x** | Devastating, creates lasting "algorithmic debt" |
| Blocks/mutes | **-74x** | Accumulates, equivalent to "show me less" |

### Critical Findings (2024-2026)

- **Links kill non-Premium reach**: Since March 2026, non-Premium link posts get ~0% median engagement
- **Native video = 10x**: 4 out of 5 user sessions now include video
- **First 30 minutes are critical**: Engagement velocity in this window determines algorithmic distribution
- **Dwell time threshold: 3 seconds**: Users must stay on your tweet >3s to signal quality
- **Positive sentiment wins**: Grok AI scores tone — constructive content gets distributed further
- **TweepCred below 0.65**: Only 3 of your tweets get considered for distribution

---

## Privacy

- All scoring runs **locally in your browser** — tweet text never leaves your device
- No backend servers, no tracking, no analytics
- No X/Twitter API access or authentication required
- The only external call is optional AI analysis via Claude API using **your own** API key
- API key stored in `chrome.storage.local` (never transmitted except to Anthropic's API)
- Full source code available for audit

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for the complete privacy policy.

---

## Development

### Tech Stack

| Technology | Role |
|------------|------|
| TypeScript 5.3 | Type-safe source code |
| React 18 | Popup and overlay UI components |
| Vite 5 + @crxjs/vite-plugin | Build toolchain with Chrome extension HMR |
| Tailwind CSS 3 | Utility-first styling (popup) |
| Chrome Manifest V3 | Extension platform APIs |

### Scripts

```bash
npm run dev          # Vite dev server with HMR
npm run build        # TypeScript check + production build
npm run build:clean  # Clean dist/ then build
npm run package      # Clean build + zip for Chrome Web Store
npm run type-check   # TypeScript only (no emit)
npm run lint         # ESLint on src/
```

### Project Structure

```
x-score-extension/
├── manifest.json              # Source manifest (CRXJS transforms for build)
├── src/
│   ├── background/
│   │   └── index.ts           # Service worker: install, messaging, score history
│   ├── content/
│   │   ├── index.tsx          # Content script: composer detection, overlay injection
│   │   ├── styles.css         # Overlay animations and scoped styles
│   │   └── components/
│   │       └── ScoreOverlay.tsx  # Collapsible score badge + expanded panel
│   ├── lib/
│   │   ├── scoring-engine.ts  # Core scoring algorithm (5 components + suggestions)
│   │   └── ai-analysis.ts     # Claude API integration for deep analysis
│   ├── popup/
│   │   ├── index.html         # Popup entry HTML
│   │   ├── main.tsx           # React mount point
│   │   ├── Popup.tsx          # 3-tab popup UI (Test, Learn, Settings)
│   │   └── styles.css         # Popup styles + Tailwind directives
│   └── types/
│       └── index.ts           # All TypeScript interfaces + default scoring weights
├── assets/                    # Extension icons (16/32/48/128 in PNG + SVG)
├── store-assets/              # Chrome Web Store listing copy
├── vite.config.ts             # Vite + CRXJS + React plugin config
├── tailwind.config.js         # Tailwind theme with X color palette
├── tsconfig.json              # TypeScript config (strict, paths alias)
└── package.json               # Dependencies and scripts
```

### How the Build Works

1. `tsc` type-checks all source files (no emit — Vite handles transpilation)
2. Vite + CRXJS reads `manifest.json`, transforms source references (`.tsx`, `.ts`) into built chunks
3. CRXJS generates a content script **loader** (tiny IIFE) that dynamically imports the real content script bundle via `chrome.runtime.getURL()`
4. A `service-worker-loader.js` is generated to import the background script bundle
5. Output lands in `dist/` — this folder is what Chrome loads as the extension

---

## Roadmap

- [ ] Timeline scoring — show scores on tweets in your feed
- [ ] Score history — track your scoring over time
- [ ] User context — integrate follower count and engagement rate into predictions
- [ ] Thread composer — per-tweet scoring within threads
- [ ] Optimal posting time — personalized suggestions based on follower timezones
- [ ] Chrome Web Store release
- [ ] Firefox and Safari support

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

The scoring logic lives in `src/lib/scoring-engine.ts` with detailed comments explaining each algorithm factor and its real-world multiplier.

---

## Disclaimer

This extension is based on publicly available information from Twitter's open-source algorithm release and community research. Scores are estimates — actual tweet performance depends on your audience, timing, content quality, trends, and X's constantly evolving algorithm.

---

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [twitter/the-algorithm](https://github.com/twitter/the-algorithm) — open-source algorithm code
- Community researchers and creators who published their findings
- [Anthropic Claude](https://anthropic.com) — AI analysis capabilities
