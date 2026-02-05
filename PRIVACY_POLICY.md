# Privacy Policy - X Algorithm Score

**Last Updated: January 2026**

## Overview

X Algorithm Score ("the Extension") is committed to protecting your privacy. This privacy policy explains how we handle information when you use our Chrome extension.

## Data We Collect

**We do not collect data to our own servers.** By default, the Extension processes tweet drafts locally on your device.

### Tweet Content
- **Local scoring**: The score and suggestions shown in the overlay are computed **entirely in your browser**.
- **Optional AI analysis**: If you choose to use the “AI analysis” feature (and have configured an API key), the draft tweet text you provide is sent to **Anthropic’s API** to generate the AI feedback. This only happens when you explicitly trigger AI analysis.

### User Data
- We do not access your X/Twitter account
- We do not require authentication
- We do not collect usernames, followers, or any profile data

### Analytics
- We do not use analytics services
- We do not track usage patterns
- We do not collect crash reports

## Data Storage

The Extension stores minimal data locally using Chrome's storage API:
- **Settings**: Your preference choices (e.g., display settings)
- **Claude API key (optional)**: If you enter an API key for AI analysis, it is stored locally in Chrome storage on your device
- **Score history (optional)**: If enabled, a small local history is saved when you post (used for your own reference only)

This data:
- Remains entirely on your device
- Is never transmitted anywhere
- Can be deleted by uninstalling the extension or clearing Chrome data

## Third-Party Services

The Extension may communicate with the following third-party service **only if you enable and use the AI analysis feature**:

- **Anthropic API**: Used to generate AI-powered feedback. Requests include your draft tweet text and your API key in the request headers.

## Permissions Explained

The Extension requests these Chrome permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save your settings locally |
| `activeTab` | Access the current X.com tab to analyze tweets |
| `host_permissions` (x.com, twitter.com, mobile.twitter.com) | Inject the scoring overlay on X websites |

## Open Source

This Extension is open source. You can audit the complete source code in this repository to verify our privacy claims.

## Children's Privacy

The Extension is not intended for children under 13. We do not knowingly collect information from children.

## Changes to This Policy

We may update this privacy policy occasionally. Significant changes will be communicated through the Extension's changelog or update notes.

## Contact

For privacy concerns or questions:
- Create an issue on this repository

## Summary

| Question | Answer |
|----------|--------|
| Do you collect my tweets? | No |
| Do you sell data? | No - we don't collect any |
| Do you use analytics? | No |
| Is my data sent anywhere? | Scoring is local; AI analysis (if used) sends draft text to Anthropic |
| Is the code auditable? | Yes - fully open source |

---

**Your privacy is guaranteed because we simply don't collect anything.**
