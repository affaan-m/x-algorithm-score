# Installation Guide

This guide covers all methods to install the X Algorithm Score Chrome extension.

---

## Table of Contents

- [Quick Install (Recommended)](#quick-install-recommended)
- [Install from Source](#install-from-source)
- [Chrome Web Store](#chrome-web-store)
- [Updating the Extension](#updating-the-extension)
- [Uninstalling](#uninstalling)
- [Troubleshooting](#troubleshooting)

---

## Quick Install (Recommended)

### Step 1: Download

Download the latest release from the GitHub **Releases** page for this repository.

Download the `.zip`, then extract it (you should see a `dist/` folder inside).

### Step 2: Extract

1. Locate the downloaded `x-algorithm-score-v0.1.0.zip` file
2. Extract/unzip the file to a folder you'll keep (e.g., `Documents/Extensions/`)
3. You should see a `dist` folder inside

### Step 3: Load in Chrome

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar and press Enter
3. Enable **Developer mode** using the toggle in the top-right corner
4. Click the **Load unpacked** button
5. Navigate to and select the `dist` folder you extracted
6. The extension should now appear in your extensions list

### Step 4: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "X Algorithm Score"
3. Click the pin icon to keep it visible

### Step 5: Verify Installation

1. Navigate to [x.com](https://x.com)
2. Click to compose a new tweet
3. Start typing - you should see a score badge appear in the bottom-right corner
4. If it doesn’t appear, open the extension popup → **Settings** and ensure:
   - **Enable extension** is on
   - **Show score while composing** is on

---

## Install from Source

For developers or those who want the latest changes.

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/affaan-m/x-algorithm-score.git

# 2. Navigate to the extension directory
cd x-algorithm-score

# 3. Install dependencies
npm install

# 4. Build the extension
npm run build
```

The built extension will be in the `dist/` folder. Follow [Step 3](#step-3-load-in-chrome) above to load it in Chrome.

### Development Mode

For hot-reloading during development:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically.

---

## Chrome Web Store

**Coming Soon!**

Once approved, you'll be able to install directly from the Chrome Web Store with one click.

---

## Updating the Extension

### From Release Download

1. Download the new version from [Releases](https://github.com/affaan-m/x-algorithm-score/releases)
2. Extract to the same location (overwrite existing files)
3. Go to `chrome://extensions/`
4. Find "X Algorithm Score" and click the **reload** icon (circular arrow)

### From Source

```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Reload in Chrome (chrome://extensions/ → reload icon)
```

---

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "X Algorithm Score"
3. Click **Remove**
4. Confirm removal
5. (Optional) Delete the downloaded/extracted folder

---

## Troubleshooting

### Extension doesn't appear after loading

- Make sure you selected the `dist` folder, not the parent folder
- Check that Developer mode is enabled
- Try refreshing the extensions page

### Score overlay doesn't show on x.com

1. Make sure you're on `x.com` or `twitter.com`
2. Try refreshing the page (Ctrl/Cmd + R)
3. Check if the extension is enabled in `chrome://extensions/`
4. Open the extension popup → **Settings** and ensure:
   - **Enable extension** is on
   - **Show score while composing** is on
5. Open DevTools (F12) → Console and look for `[X Algorithm Score]` messages

### "Manifest file is missing or unreadable"

- You may have selected the wrong folder
- Make sure you're selecting the `dist` folder that contains `manifest.json`
- Verify the zip was fully extracted

### Extension icon is missing from toolbar

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "X Algorithm Score" in the list
3. Click the pin icon to add it to the toolbar

### Score seems incorrect

The scoring is based on publicly available algorithm information and may not perfectly match X's actual ranking. Factors considered:

- Tweet length (optimal: 120-240 characters)
- Media presence (images, videos boost score)
- Questions (encourage replies)
- External links (penalized, especially for non-Premium)
- Hashtags (>2 triggers spam detection)
- Mentions (>3 looks spammy)

### AI Analysis not working

1. Make sure you've added your Claude API key in Settings
2. Check that the API key is valid at [console.anthropic.com](https://console.anthropic.com)
3. Ensure you have API credits available
4. Note: AI analysis sends the draft tweet text to Anthropic when you click **Deep Analysis with AI**

### Need more help?

- [Open an issue](https://github.com/affaan-m/x-algorithm-score/issues) on GitHub
- Check existing issues for similar problems

---

## System Requirements

- **Browser**: Google Chrome 88+ (Manifest V3 support)
- **Operating System**: Windows, macOS, or Linux
- **Permissions Required**:
  - `storage` - Save your settings locally
  - `activeTab` - Access the current tab to inject the overlay
  - Host access to `x.com`, `twitter.com`, and `mobile.twitter.com`

---

## Privacy Note

- All scoring happens locally in your browser
- No data is sent to external servers (except optional AI analysis, which sends your draft tweet text to Anthropic using your API key)
- No account information is accessed or stored
- Optional local score history can be enabled in Settings (stored on-device only)
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details
