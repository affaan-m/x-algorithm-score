# Contributing

Thanks for contributing to **X Algorithm Score**.

## Development setup

### Prerequisites

- Node.js v18+
- npm

### Install & run

```bash
npm install
npm run dev
```

Then load the extension in Chrome:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the generated `dist/` directory

## Common commands

```bash
npm run build
npm run test
npm run type-check
npm run lint
npm run check
```

## Project layout

- `src/content/`: content script + score overlay injected into `x.com`
- `src/popup/`: extension popup UI
- `src/background/`: service worker
- `src/lib/`: scoring + optional AI analysis

## Privacy / AI analysis

- The base score and suggestions are computed locally.
- If you use the AI analysis feature, the draft tweet text is sent to Anthropic’s API using the user-provided API key stored in Chrome local storage. Keep docs aligned with `PRIVACY_POLICY.md`.

## Pull requests

- Keep PRs focused and small when possible.
- Run `npm run type-check` and `npm run lint` before submitting.
- If you add a user-facing feature, update `README.md` / `INSTALL.md` / `PRIVACY_POLICY.md` accordingly.

