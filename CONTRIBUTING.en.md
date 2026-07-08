# Contributing to BigGo Extension

> [繁體中文](./CONTRIBUTING.md) | English

Thanks for your interest in contributing! This document explains how to set up
the project, our code conventions, and how to get changes merged.

> **Repository model.** This GitHub repository is the upstream, source of truth.
> Funmula's internal builds are maintained as a downstream fork; internal-only
> configuration (analytics keys, private endpoints) is **not** part of this
> open-source repository. Contributions here flow upstream-first.

## Getting started

Requirements:

- Node.js >= 18
- pnpm >= 8 (recommended) or npm >= 8

```bash
pnpm install       # install dependencies (ships pnpm-lock.yaml for reproducible installs; npm install also works)
npm run build:dev  # development build → ./dist
npm run watch      # Vite watch mode (Chromium MV3)
```

Load the unpacked `./dist` directory in your browser:

- **Chrome/Edge**: `chrome://extensions` → enable *Developer mode* → *Load unpacked* → select `dist/`
- **Firefox**: run `npm run build:v2`, then `about:debugging` → *This Firefox* → *Load Temporary Add-on* → select `dist/manifest.json`

Production builds:

```bash
npm run build          # Chromium (MV3)
npm run build:v2       # Firefox (MV2)
npm run build:safari   # Safari (MV2)
```

See the *How it works* section of [`README.en.md`](./README.en.md) for architecture
details, [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for build variants, environment
variables, backend hosts and project structure, and [`docs/`](./docs/) for per-subsystem
workflow documentation.

## Code style & naming

The project is **ESM JavaScript** (`"type": "module"`) with **no ESLint / Prettier
configured yet**, so follow these conventions **by hand**, and above all keep new
code consistent with the surrounding files.

**Formatting**

- Indent with **2 spaces**, no tabs.
- Use **double quotes** for strings: `"..."`.
- **No trailing semicolons** (rely on ASI).
- Use ESM named imports with no space inside braces: `import {foo, bar} from "./mod"`.
- Prefer `const`; use `let` only when reassignment is needed; avoid new `var`.

**Naming**

- Variables and functions: `camelCase` (e.g. `getSitesLang`, `domCashbackBtn`).
- Module-level constants: `UPPER_SNAKE_CASE` (e.g. `ELEMENT_ID`, `DESTROY_TIME`).
- Classes and Svelte components: `PascalCase` (e.g. `Dialog`).
- Conventional prefixes: booleans use `is*` (`isLogin`, `isCashbackActive`); DOM
  node variables use `dom*` (`domClose`).
- File names: layer/entry-point files use dotted names (`content.listener.js`,
  `background.bundle.js`); regular modules use `camelCase` (`storeDescPopup.js`).

**Other**

- All user-facing text must go through `i18n()` — **never hardcode strings**. This
  is the basis of multi-locale support.
- Sites are always identified by their **nindex** (`{region}_{type}_{name}`).

## Development notes

- **Analytics / secrets.** The open-source build must run without any private
  credentials. Analytics keys are injected at build time from environment
  variables and default to a no-op when unset — never hardcode a real key.
- **Three execution contexts.** Background, content scripts, and the Svelte
  frontend communicate through the Bridge message-passing layer. Read
  [`docs/workflow-content-message.md`](./docs/workflow-content-message.md)
  before touching cross-context code.
- **No test framework is configured yet.** Please describe manual testing steps
  in your PR (which sites, which browsers).

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short summary>

feat:     a new feature
fix:      a bug fix
docs:     documentation only
refactor: code change that neither fixes a bug nor adds a feature
chore:    tooling / maintenance
build:    build system or dependencies
```

Keep summaries in the imperative mood (e.g. "fix: normalize account token").

## Branching & pull request process

**Before you start**

- For anything non-trivial, **open an issue first** to align on the approach
  before writing code — it saves wasted effort.
- One PR does **one thing**: keep features, bug fixes, and refactors in separate
  PRs; don't mix unrelated changes.

**Branch naming**

- Branch off the latest `main` with a topic branch.
- Name branches after the commit type: `feat/…`, `fix/…`, `docs/…`, `refactor/…`,
  `chore/…` (e.g. `fix/cashback-token-normalize`).

**Opening a PR**

1. Fork the repo and create a topic branch from `main`.
2. Make your change; keep the diff focused.
3. Verify a production build succeeds (`npm run build`) and the extension loads.
4. Open a PR describing **what** changed, **why**, and **how you tested it**
   (which sites/nindex, which browsers). Link the related issue if there is one.

**What gets merged**

- A production build passes, and the extension loads and works.
- Follows the style and naming conventions above, consistent with nearby code.
- No real keys/secrets are hardcoded; all user-facing strings go through `i18n()`.
- The diff is focused, with no unrelated refactors or formatting churn.
- A maintainer will review. Address feedback with **follow-up commits**; don't
  force-push over already-reviewed history unless a maintainer asks.

## Licensing of contributions

This project is licensed under the **Apache License 2.0**. By submitting a
contribution, you agree that your contribution is licensed under the same terms,
as described in Section 5 of the license. No separate CLA is required.

## Code of Conduct

Participation is governed by our [Code of Conduct](./CODE_OF_CONDUCT.en.md).

## Reporting security issues

**Do not** open a public issue for security vulnerabilities. See
[`SECURITY.en.md`](./SECURITY.en.md) for private disclosure instructions.
