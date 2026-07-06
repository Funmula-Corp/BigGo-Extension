# BigGo Extension

A cross-browser shopping assistant extension for Chrome (MV3), Firefox (MV2), and Safari (MV2). It integrates with e-commerce sites and Google Search to provide cashback tracking, price history, coupon recommendations, "More Like This" product suggestions, and search result aggregation.

## Requirements

- Node.js >= 18
- pnpm >= 8 (recommended) or npm >= 8

## Install

This repo ships a `pnpm-lock.yaml`, so pnpm gives you a reproducible install:

```bash
pnpm install
```

npm also works (it resolves from `package.json`):

```bash
npm install
```

## Build

### Production

```bash
npm run build          # Chromium (MV3)
npm run build:v2       # Firefox (MV2)
npm run build:safari   # Safari (MV2)
```

### Development

```bash
npm run build:dev      # One-shot development build
npm run watch          # Vite watch mode (MV3)
```

Build output goes to `./dist`, which can be loaded directly into a browser as an unpacked extension for testing.

### Packaging

```bash
npm run bundle         # Zip up dist/
npm run bundle:all     # Build every variant and zip each
```

## Configuration

### Environment variables

The build reads the following environment variables:

| Variable | Set by | Purpose |
| --- | --- | --- |
| `NODE_ENV` | npm scripts | `production` or `development`. Controls minification and dev-only behavior. |
| `MANIFEST_VERSION` | npm scripts | `2` or `3`. Selects the manifest variant (MV2 for Firefox/Safari, MV3 for Chromium). |
| `BROWSER` | npm scripts | `chrome`, `safari`, or empty. Applies browser-specific manifest tweaks. |
| `GA_API_SECRET` | **you** (optional) | Google Analytics Measurement Protocol API secret. Analytics is **disabled** when unset. |
| `GA_MEASUREMENT_ID` | **you** (optional) | Google Analytics measurement ID (`G-XXXXXXXXXX`). Analytics is **disabled** when unset. |

`NODE_ENV`, `MANIFEST_VERSION`, and `BROWSER` are set automatically by the `npm run build*` scripts — you normally don't set them by hand.

`GA_API_SECRET` / `GA_MEASUREMENT_ID` are the only variables you supply yourself, and only if you want analytics. If either is missing, the extension skips all analytics calls, so a plain `npm run build` produces a fully working extension with telemetry off:

```bash
GA_API_SECRET=xxxxxxxx GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run build
```

For a real deployment, set these through your CI/CD secret store rather than committing them.

### Backend hosts

The API host (`extension.biggo.com`) and account host (`account.biggo.com`) are hard-coded in `vite.config.ts` and `util/vite-build.js` (the `define` block). Point them at your own backend by editing those two files.

## Maintaining sites.json

`biggo/js/sites.json` is a static fallback dataset bundled into the extension (domain fields only). At runtime the extension prefers the live list from the API and falls back to this file. To refresh it:

```bash
npm run update:sites   # Fetch the latest sites data from the API and write sites.json
npm run clean:sites    # Strip sites.json down to domain fields only
```

## Project structure

```
biggo/
├── _locales/          # i18n translations
├── js/
│   ├── background.bundle.js   # Background script entry
│   ├── content.bundle.js      # Content script entry
│   ├── frontend.bundle.js     # Svelte app entry
│   ├── core/shared/           # Cross-context shared logic
│   ├── libs/                  # Background modules (sync, cashback, icon)
│   ├── content/               # Content script modules (iframe injection, search integration)
│   ├── prototype/             # Bridge message-passing architecture
│   ├── frontend/svelte/       # Svelte 5 components
│   └── sites.json             # Static fallback site data
├── pages/                     # Extension pages (popup, options, privacy)
├── manifest.base.json         # Shared manifest
├── manifest.v3.json           # Chrome MV3 only
├── manifest.v2.json           # Firefox/Safari MV2 only
├── manifest.safari.json       # Safari-specific overrides
└── manifest.biggo.json        # BigGo domain list (merged in at build time)
util/
├── build.js                   # Main build script (copy assets → Vite → merge manifests)
├── vite-build.js              # Vite programmatic API (12 IIFE bundles)
├── bundle.js                  # Zip up dist/
├── clean-sites.js             # Strip sites.json
└── update-sites.js            # Refresh sites.json
native/
└── safari/                    # Xcode project wrapping the extension as a Safari app
```

## Tech stack

- **Build**: Vite 6 + Svelte 5 compiler
- **UI**: Svelte 5
- **Runtime**: ES modules, async/await
- **Only runtime dependency**: `uuid`

The extension has three execution contexts that communicate via browser message passing: a **background script** (service worker on MV3, persistent page on MV2), **content scripts** injected into pages, and a **Svelte frontend** dynamically injected by the content scripts.
