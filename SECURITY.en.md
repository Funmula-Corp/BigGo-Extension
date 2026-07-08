# Security Policy

> [繁體中文](./SECURITY.md) | English

BigGo Extension runs in users' browsers and interacts with e-commerce sites,
handling data such as login state, cashback sessions, and browsing on shopping
pages. We take security reports seriously and appreciate responsible disclosure.

## Supported versions

Security fixes are applied to the latest released version published on the
browser stores. Please make sure you are on the latest version before reporting.

| Version | Supported |
| ------- | --------- |
| Latest release (Chrome Web Store / AMO) | ✅ |
| Older versions | ❌ |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
discussions, or pull requests.**

Instead, report privately using **one** of:

- **GitHub Security Advisories** — the "Report a vulnerability" button under the
  repository's **Security** tab (preferred).
- **Email** — security@biggo.vip

Please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce (affected site/nindex, browser + version, extension version).
- Any proof-of-concept, logs, or screenshots.
- Whether the issue is already public or known to third parties.

## What to expect

- **Acknowledgement** within 3 business days.
- **Initial assessment** (severity, affected components) within 7 business days.
- We will keep you updated on remediation progress and coordinate a disclosure
  timeline with you. We aim to ship fixes for high-severity issues promptly.
- With your permission, we are happy to credit you once a fix is released.

## Scope

In scope:

- The extension source code in this repository (background, content scripts,
  Svelte frontend, build tooling).
- Vulnerabilities that affect the confidentiality, integrity, or availability of
  user data handled by the extension.

Out of scope:

- BigGo's backend/API services (`*.biggo.com`) — report those to the same
  contact, but note they are governed by our website's disclosure program.
- Findings that require a compromised device, physical access, or social
  engineering of the user.
- Reports from automated scanners without a demonstrated, exploitable impact.

## Safe harbor

We will not pursue or support legal action against researchers who:

- Make a good-faith effort to comply with this policy,
- Avoid privacy violations, data destruction, and service disruption, and
- Give us reasonable time to remediate before any public disclosure.

Thank you for helping keep BigGo users safe.
