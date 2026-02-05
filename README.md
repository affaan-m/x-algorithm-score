# X Algorithm Score

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

> **Score your tweets before posting based on X's actual recommendation algorithm. Get real-time feedback to maximize your reach.**

A Chrome extension that analyzes your draft tweets against X's (Twitter's) open-sourced algorithm, providing instant scoring, actionable suggestions, and predicted reach estimates.

![X Algorithm Score](assets/icon-128.png)

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [Algorithm Insights](#algorithm-insights)
- [AI-Powered Analysis](#ai-powered-analysis)
- [Score Breakdown](#score-breakdown)
- [Privacy](#privacy)
- [Development](#development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Features
- **Real-time Scoring** — See your tweet's algorithm score (0-100) as you type
- **Letter Grades** — S/A/B/C/D/F grading system for quick assessment
- **Score Breakdown** — Understand how content, media, timing, engagement, and risk factors affect your reach
- **Actionable Suggestions** — Get specific tips based on algorithm research
- **Predicted Reach** — Estimate impressions based on your score

### Advanced Features
- **AI Analysis** — Deep analysis with Claude API for originality, audience fit, and rewrite suggestions
- **Algorithm Factors** — See exactly which signals are optimal, suboptimal, or harmful
- **Media Detection** — Automatically detects images, videos, GIFs, and polls
- **Link Warnings** — Critical alerts for external links (especially for non-Premium accounts)
- **Template Detection** — Identifies overused formats that get penalized

---

## Screenshots

Screenshots are coming soon. (The repo currently ships icons in `assets/`, but not marketing screenshots yet.)

---

## Installation

### Option 1: Download Release (Recommended)

1. Download the latest release from the GitHub **Releases** page for this repository
2. Unzip the downloaded file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top-right corner)
5. Click **Load unpacked**
6. Select the unzipped `dist` folder
7. Navigate to [x.com](https://x.com) and start composing!

### First-run checklist (60 seconds)

1. Pin the extension (puzzle icon → pin “X Algorithm Score”)
2. Go to [x.com](https://x.com) → click compose
3. If the overlay doesn’t show, open the popup → **Settings**:
   - Enable extension
   - Show score while composing

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/affaan-m/x-algorithm-score.git
cd x-algorithm-score

# Install dependencies
npm install

# Build the extension
npm run build

# Load the dist/ folder in Chrome (see Option 1, step 3-7)
```

### Option 3: Chrome Web Store

Coming soon!

---

## Usage

### Basic Usage

1. Navigate to [x.com](https://x.com) or [twitter.com](https://twitter.com)
2. Click to compose a new tweet
3. The **score badge** appears in the bottom-right corner
4. Type your tweet and watch the score update in real-time
5. Click the badge to expand and see detailed analysis
6. Follow suggestions to improve your score before posting

### Popup Features

Click the extension icon (XS) to open the popup:

| Tab | Description |
|-----|-------------|
| **Test** | Score tweets without being on X.com, includes AI analysis |
| **Learn** | Algorithm insights and tips |
| **Settings** | Configure overlay + AI + history |

### Settings

- **Enable extension**: Master on/off
- **Show score while composing**: Controls the overlay on `x.com`
- **Show suggestions**: Toggle suggestions UI in the overlay
- **Minimum score alert**: Shows a warning when score is below your target
- **Score history (optional)**: If enabled, saves a local entry when you post
- **Claude API key (optional)**: Enables AI analysis (sends draft text to Anthropic when triggered)

---

## Algorithm Insights

This extension provides draft tweet scoring based on analysis of:
- **[xai-org/x-algorithm](https://github.com/xai-org/x-algorithm)** — X's open-source feed ranking pipeline (2025-2026)
- **[twitter/the-algorithm](https://github.com/twitter/the-algorithm)** — Initial open-source release (2023)
- **Community research** — Creator best practices and observed patterns

### ✅ Verified from Open-Source Code

These insights are directly traceable to `xai-org/x-algorithm`:

| Insight | Source | Notes |
|---------|--------|-------|
| **Multi-Action Prediction** | [README.md](https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md) | Model predicts P(like), P(reply), P(repost), P(click), P(share), P(block), P(mute), P(report), etc. |
| **Weighted Score Combination** | [weighted_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs) | Final score = Σ(weight × P(action)); positive + negative signals |
| **Video Duration Gating** | [weighted_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs) | Videos must exceed MIN_VIDEO_DURATION_MS for VQV weight |
| **Author Diversity** | [author_diversity_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/author_diversity_scorer.rs) | Repeated authors get exponential decay: `(1-floor) × decay^position + floor` |
| **Out-of-Network Penalty** | [oon_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/oon_scorer.rs) | OON posts multiplied by `OON_WEIGHT_FACTOR < 1.0` |
| **Candidate Isolation** | [README.md](https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md) | Candidates can't attend to each other during ranking |

**Important:** Actual weight values (e.g., `FAVORITE_WEIGHT`, `REPLY_WEIGHT`) are configured in `params` and **not published** in the open-source code.

### ⚠️ Heuristic Estimates

These insights are based on community research and observed patterns, **not directly verifiable** from open-source code:

| Insight | Type | Notes |
|---------|------|-------|
| **Reply engagement value** | Community observation | Replies appear to drive more reach than likes |
| **Video engagement boost** | Best practice | Native videos typically show higher engagement |
| **External link penalties** | Community observation | Links may reduce reach, especially for non-Premium |
| **Question effectiveness** | Best practice | Questions tend to generate reply engagement |
| **Dwell time thresholds** | Inference | Dwell scoring exists but thresholds not public |
| **Timing windows** | Best practice | Peak hours based on general social media patterns |

See [INSIGHTS_AUDIT.md](INSIGHTS_AUDIT.md) for full source attribution and methodology.

---

## AI-Powered Analysis

Enable deep analysis with Claude AI for enhanced feedback:

### Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the extension popup
3. Go to **Settings** tab
4. Enter your API key and save

### AI Features

- **Originality Assessment** — Detects template/generic content
- **Engagement Prediction** — Reply likelihood and viral potential
- **Rewrite Suggestions** — AI-generated improvements
- **Audience Analysis** — Who your tweet appeals to

> **Note**: When you click the AI analysis button, your draft tweet text is sent to the Anthropic API using your locally-stored API key. The base score and suggestions are computed locally. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

---

## Score Breakdown

### Grading Scale

| Grade | Score | Description |
|-------|-------|-------------|
| **S** | 90-100 | Excellent - optimized for maximum reach |
| **A** | 80-89 | Great - strong algorithm signals |
| **B** | 65-79 | Good - room for improvement |
| **C** | 50-64 | Fair - missing key optimizations |
| **D** | 35-49 | Poor - significant issues |
| **F** | 0-34 | Needs work - major problems detected |

### Scoring Components

| Component | Max Points | What It Measures |
|-----------|------------|------------------|
| **Content** | 25 | Length, structure, threads, emojis |
| **Media** | 20 | Images, videos, GIFs, polls |
| **Timing** | 15 | Posting time optimization |
| **Engagement** | 20 | Questions, CTAs, reply potential |
| **Risk** | -30 | Links, hashtags, spam signals, sentiment |

### Positive Factors

- **Media attached**: +12-20 points (video highest)
- **Question included**: +8 points (drives replies)
- **Optimal length** (120-240 chars): +8 points
- **Thread format**: +3-5 points
- **Call-to-action**: +4 points

### Risk Factors (Penalties)

- **External links**: -15 (Premium) / -20 (non-Premium)
- **Excessive hashtags** (>2): -3 per extra
- **Excessive mentions** (>3): -2 per extra
- **Template content**: -5 points
- **Negative sentiment**: -3 points

---

## Privacy

- **100% Local Processing** — All scoring happens in your browser
- **No Data Collection** — Tweet content never leaves your device
- **No External Servers** — No backend, no tracking, no analytics
- **No X API Access** — Works without authentication
- **Open Source** — Audit the code yourself

The only external call is optional AI analysis (using your own API key).

---

## Development

### Tech Stack

- **TypeScript** — Type-safe development
- **React 18** — UI components
- **Vite + CRXJS** — Fast builds with HMR
- **Tailwind CSS** — Styling
- **Manifest V3** — Modern Chrome extension API

### Commands

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Full quality gate (typecheck + lint + test + build)
npm run check
```

### Project Structure

```
src/
├── background/       # Service worker
├── content/          # Content script + overlay
│   ├── components/   # React components
│   └── index.tsx     # Entry point
├── lib/              # Core logic
│   ├── scoring-engine.ts   # Algorithm scoring
│   └── ai-analysis.ts      # Claude API integration
├── popup/            # Extension popup
└── types/            # TypeScript definitions
```

---

## Roadmap

### v0.2.0 ✅ Complete
- [x] Timeline tweet scoring (show scores on existing tweets)
- [x] Score history tracking with export to CSV
- [x] User context integration (follower count, engagement rate)

### v0.3.0 ✅ Complete
- [x] Thread composer with per-tweet scoring
- [x] Optimal posting time suggestions
- [x] Analytics dashboard with trends and insights
- [x] A/B testing variant generator

### v0.4.0 (Planned)
- [ ] Chrome Web Store release
- [ ] Enhanced timeline scoring with filters
- [ ] Historical performance tracking

### Future
- [ ] Firefox support
- [ ] Safari support
- [ ] Advanced analytics with A/B test results
- [ ] Automated best time scheduler

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for local dev setup and guidelines.

### Understanding the Scoring

Read the detailed comments in `src/lib/scoring-engine.ts` to understand the algorithm analysis and scoring logic.

---

## Disclaimer

This extension is based on publicly available information from Twitter's open-source algorithm release and community research. Scoring predictions are estimates. Actual tweet performance depends on many factors including:

- Your audience size and engagement
- Posting timing
- Content quality and relevance
- Current events and trends
- X's constantly evolving algorithm

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [twitter/the-algorithm](https://github.com/twitter/the-algorithm) — Open-source algorithm release
- Community researchers and creators who shared their findings
- [Anthropic Claude](https://anthropic.com) — AI analysis capabilities

---

<p align="center">
  <strong>Built to help creators maximize their reach on X</strong>
  <br>
  <a href="https://github.com/affaan-m/x-algorithm-score/issues">Report Bug</a>
  ·
  <a href="https://github.com/affaan-m/x-algorithm-score/issues">Request Feature</a>
</p>
