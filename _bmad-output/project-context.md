---
project_name: 'x-algorithm-score'
user_name: 'Dre'
date: '2026-02-05'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules']
existing_patterns_found: 4
status: 'draft'
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Core stack (source of truth: `package.json`, `manifest.json`, `vite.config.ts`, `tsconfig.json`)
- Chrome Extension: Manifest V3 (`manifest.json`), repo version `0.1.0`
- Build: Vite `^5.0.12` + `@crxjs/vite-plugin` `^2.3.0` (manifest imported from repo root)
- Language: TypeScript `^5.3.3` with strict settings:
  - `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
  - `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `types: ["chrome"]`
- UI: React `^18.2.0` + React DOM `^18.2.0`
- Styling: Tailwind `^3.4.1` + PostCSS `^8.4.33` + Autoprefixer `^10.4.17`
- State: Zustand `^4.5.0`
- Icons: lucide-react `^0.314.0`
- Linting: ESLint `^8.56.0` with flat config (`eslint.config.js`) + `@typescript-eslint/*` `^6.19.0`

### Hard constraints (agents MUST follow)
- **MV3 constraints**: keep background as a service worker; avoid MV2 APIs/patterns.
- **No-unused enforcement**: new code must not introduce unused locals/params (TS will fail).
- **Manifest flow**: `manifest.json` is treated as a build input (CRXJS) — don’t move it or rewrite to a different generation approach without updating Vite/CRX build.
- **Permissions**: keep permissions minimal; any new permission must be justified in docs (README + privacy policy) and considered for store review impact.

### Upgrade / change safety notes (to avoid breaking “premium polish” work)
- Vite/CRXJS upgrades can subtly break extension loading; after dependency bumps, validate:
  - `npm run build` output loads in `chrome://extensions` (Load unpacked `dist/`)
  - content script still injects on `x.com` and popup renders
- Tailwind is configured but current UI uses a lot of inline styles; if migrating to Tailwind for a more “native” feel:
  - ensure styles are correctly bundled for **popup** and **content overlay**
  - avoid class-name churn that makes quick UI iteration harder to review

### Optional AI integration (privacy/store-review relevant)
- AI analysis uses Anthropic Messages API via direct `fetch()` in the client.
- It should remain **explicitly user-triggered** (no background/automatic calls) and consistently documented in `PRIVACY_POLICY.md`.

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict TS is enforced** (`strict`, `noUnusedLocals`, `noUnusedParameters`): don’t introduce unused vars/params. Avoid “temporary” code paths that leave dead symbols behind.
- **ESM everywhere**: repo is ESM (`"type": "module"`). Use ESM `import/export` only.
- **TS build model**: project uses `moduleResolution: "bundler"` + `isolatedModules: true` + `noEmit: true`.
  - Avoid patterns that require type-level emit tricks. Keep modules side-effect safe.
- **Path alias**: prefer `@/…` for `src/…` imports when it improves clarity (configured in TS + Vite).
- **Extension context separation (common failure mode)**:
  - **Service worker** (`src/background/*`): no DOM (`window`, `document`) usage.
  - **Content script** (`src/content/*`): DOM is allowed, but assume selectors return null and X’s DOM changes frequently.
  - **Popup** (`src/popup/*`): DOM allowed, but keep shared logic in `src/lib/*`.
- **Guard `chrome` in shared code**: any code that might run outside extension contexts must guard access:
  - Use `typeof chrome !== 'undefined' && chrome.storage` (existing pattern in `src/lib/ai-analysis.ts`).
- **Async Chrome APIs**:
  - If adding runtime message handlers that respond async, ensure you **return `true`** from the listener (pattern already used in `src/background/index.ts`).
  - Prefer consistent promise-wrapping patterns for `chrome.storage` reads/writes in new code.
- **Typed cross-context boundaries (premium refactors depend on this)**:
  - Define a single discriminated union for runtime messages (e.g., `RuntimeMessage`) in `src/types/` and reuse it across content/background/popup.
  - Define a typed settings/storage schema in `src/types/` and keep it the single source of truth for `chrome.storage` read/write shapes.
  - Prefer a shared capability helper for guarded APIs (e.g., `isChromeStorageAvailable()`) rather than repeating ad-hoc guards everywhere.
- **CSS / UI safety (premium refactors often break here)**:
  - Keep content-script UI styles **namespaced** to `#x-algorithm-score-overlay` to avoid colliding with X.
  - Respect `prefers-reduced-motion`.
- **Network calls & privacy**:
  - Scoring stays local. Any new external calls must be explicitly user-triggered and reflected in `PRIVACY_POLICY.md` + store listing.
- **Types**:
  - Reuse types from `src/types/` (don’t duplicate interfaces).
  - Prefer explicit types at boundaries (storage shapes, message payloads, scoring inputs/outputs).

### Framework-Specific Rules (React + MV3 Extension UI)

- **React-only code stays in UI contexts**:
  - Don’t import React components into `src/background/*` (service worker).
  - Keep shared “pure logic” in `src/lib/*` and shared types in `src/types/*`.
- **StrictMode awareness**: content script renders under `React.StrictMode`; effects can run twice in dev. Avoid side effects in render; make effects idempotent and always clean up.
- **Overlay rendering**:
  - Create the overlay root once; re-render to update (current pattern in `src/content/index.tsx`).
  - Keep the overlay isolated: styles must be namespaced under `#x-algorithm-score-overlay`.
- **Performance during typing**:
  - Keep per-keystroke work lightweight; prefer debounced updates.
  - Avoid expensive derived computations in render; use `useMemo` where it materially reduces work.
  - Prefer transform/opacity transitions over layout-heavy animations when polishing UI.
- **Accessibility is required for “premium” UX**:
  - Use semantic elements (`button`, tab roles/ARIA patterns) rather than `div` click handlers.
  - Support keyboard navigation and `prefers-reduced-motion` for animations.

### Testing Rules

- **Current state**: no automated test framework is configured yet (no `test` script; no Vitest/Jest/Playwright deps). When adding tests, prefer a small, standard stack.
- **Unit tests first (highest ROI)**:
  - Cover `src/lib/scoring-engine.ts` and any new “premium UX” logic with fast unit tests (pure functions).
  - Prioritize regression-prone areas: parsing (`parseTweetFeatures`), risk penalties, suggestion ordering, and score normalization.
- **UI behavior tests (targeted)**:
  - For overlay/popup React components, test keyboard + ARIA behavior (tabs, escape-to-close) and “empty state” rendering.
  - Keep UI tests focused on behavior/contract (not pixel-perfect styling).
- **E2E smoke (minimum viable)**:
  - Maintain a repeatable manual or automated smoke run that verifies:
    - `npm run build` → load `dist/` in `chrome://extensions`
    - overlay injects on `x.com` and responds while typing
    - popup opens and renders without console errors
- **Performance guardrails (typing loop)**:
  - Avoid tests that require real X.com DOM; instead validate debouncing and “no excessive work per keystroke” assumptions via unit tests where possible.
  - Treat any new observers/timers as potential perf regressions; ensure cleanup in effects (StrictMode can double-run effects in dev).
- **Security/privacy/store-review checks (testable rules)**:
  - Any new network call must be explicitly user-triggered and documented (privacy policy).
  - Avoid adding permissions without a documented justification and user-facing value.

