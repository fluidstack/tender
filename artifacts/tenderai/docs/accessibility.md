# TenderAI Accessibility Statement

TenderAI targets **WCAG 2.1 Level AA** conformance. This document describes the
measures we take, the assistive-technology compatibility we test, and the
known limitations users should be aware of.

## Conformance target

- **Standard**: Web Content Accessibility Guidelines (WCAG) 2.1
- **Level**: AA
- **Scope**: the TenderAI web artifact (`artifacts/tenderai`).
  Internal admin tooling and embedded third-party identity flows
  (Clerk-hosted sign-in/sign-up) are styled to inherit the same theme but are
  governed by their vendor's own accessibility statements.

## How we meet WCAG 2.1 AA

| Area | Implementation |
| ---- | -------------- |
| **1.3.1 Info & Relationships** | Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), one `<h1>` per page, lists for navigation, `htmlFor`-bound `<label>`s on every form control. |
| **1.4.3 Contrast (Minimum)** | Token `--muted-foreground` was raised to `hsl(215 25% 35%)` so muted text on the default background passes 4.5:1. Primary, destructive and ring tokens are checked against AA. |
| **1.4.4 Resize text / 1.4.10 Reflow** | Viewport meta tag does **not** set `maximum-scale`; the layout is fluid down to 320 px and supports 200% zoom without horizontal scrolling. |
| **2.1.1 Keyboard** | All interactive controls are native `<button>`/`<a>`/Radix primitives with full keyboard support. No keyboard traps. |
| **2.3.3 Animation from Interactions** | A global `@media (prefers-reduced-motion: reduce)` rule disables non-essential animation. |
| **2.4.1 Bypass Blocks** | A "Skip to main content" link is the first focusable element on every page. |
| **2.4.3 Focus Order / 3.2.3 Consistent Navigation** | Route changes move focus to `<main>` so screen readers announce the new view. |
| **2.4.7 Focus Visible** | A 2 px focus ring using `--ring` is applied via `:focus-visible` on every interactive element. |
| **3.3.1 Error Identification / 3.3.2 Labels or Instructions** | Required fields use `required` + `aria-required` and toggle `aria-invalid` until satisfied. Required indicators are visible to sighted users and announced via screen-reader-only text. |
| **4.1.2 Name, Role, Value** | All icon-only buttons (delete, import, save, etc.) carry an `aria-label`; decorative `lucide-react` icons are marked `aria-hidden="true"`. Active navigation items expose `aria-current="page"`. |
| **4.1.3 Status Messages** | Toast notifications use Radix's `ToastProvider`. Informational toasts announce politely (`type="background"`); destructive toasts announce assertively (`type="foreground"`). |

## Assistive technology compatibility

We design and test against:

- VoiceOver on macOS (Safari, Chrome)
- NVDA on Windows (Firefox, Chrome)
- Keyboard-only navigation
- 200% page zoom and 320 px viewport reflow

## Automated testing

End-to-end accessibility tests use `@axe-core/playwright` against the running
`artifacts/tenderai: web` workflow. The test plan covers the landing page,
dashboard, tenders list, tender detail, and profile page; the build target is
**zero serious or critical violations**.

## Known limitations

- **Clerk-hosted pages** (`/sign-in`, `/sign-up`, `<UserButton/>` menu) are
  rendered by Clerk and inherit our shadcn theme. Their detailed conformance
  is the responsibility of Clerk; we ship the AA-friendly theme and report
  upstream issues we observe.
- **Generated PDF/DOCX exports** of tender drafts are produced by the API
  server. Tagged PDF accessibility is **out of scope** for this milestone and
  tracked as a follow-up.
- The mobile (Expo) and slides artifacts are **not** in scope of this
  statement; they have their own conformance plans.

## Reporting accessibility issues

If you encounter an accessibility barrier in TenderAI, please open an issue in
the project tracker with the URL, the assistive technology you used, and a
short description of what failed. We aim to triage accessibility reports
within five business days.

_Last reviewed: 2026-05-03._
