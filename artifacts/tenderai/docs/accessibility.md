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

End-to-end accessibility tests use `@axe-core/playwright` 4.11 against the
running `artifacts/tenderai: web` workflow and the WCAG 2.0/2.1 A and AA tag
set. The build target is **zero serious or critical violations**.

Coverage in `artifacts/tenderai/tests/a11y.spec.ts` (all tests run by default,
no env vars required):

| Test                                              | Route                       | Notes                                    |
| ------------------------------------------------- | --------------------------- | ---------------------------------------- |
| landing axe scan                                  | `/`                         | public                                   |
| sign-in axe scan                                  | `/sign-in`                  | public (Clerk-hosted in real envs)       |
| sign-up axe scan                                  | `/sign-up`                  | public (Clerk-hosted in real envs)       |
| not-found axe scan                                | `/__definitely-missing__`   | public                                   |
| dashboard / tenders / tender-detail / profile / admin axe scans | `/dashboard`, `/tenders`, `/tenders/1`, `/profile`, `/admin` | rendered via the in-app a11y bypass (see below); each test asserts the protected `<main id="main-content">` and skip link are present so we know we scanned the real shell, not a 404. |
| skip-link → focus moves to `<main>`               | `/dashboard`                | bypassed shell                           |
| header / nav / main / footer landmarks present    | `/dashboard`                | bypassed shell                           |
| `prefers-reduced-motion` collapses transitions    | `/`                         | public                                   |

Each test runs against four projects (desktop-light, desktop-dark,
mobile-light, mobile-dark) for a 4× matrix.

### Deterministic auth bypass for axe scanning

Authenticated routes are gated by Clerk's `<SignedIn>`/`<SignedOut>` and a
`<Redirect to="/sign-in">`. To make the axe matrix deterministic without
provisioning Clerk sessions, the app honours a runtime flag set only by
Playwright via `addInitScript`:

```ts
await page.addInitScript(() => {
  (window as any).__E2E_A11Y__ = true;
});
```

When `window.__E2E_A11Y__ === true` (only true inside the Playwright tests):

- `App` renders the router without `<ClerkProvider>` so the rest of the tree
  never touches Clerk hooks.
- `SignedIn` always renders its children; `SignedOut` always renders nothing.
- `AppShell`'s `<UserButton>` is replaced with a focusable, labelled
  placeholder so the protected layout still renders.

The flag has no effect in production: it must be set by an external script
before the SPA bootstraps, which only Playwright can do. Each authed test
also asserts `main#main-content` and `a.skip-link` are present, so the suite
fails loudly if the bypass ever stops working and we accidentally scan a 404.

Run the suite from the repo root:

```
PORT=20547 pnpm --filter @workspace/tenderai run test:a11y
```

## Per-route conformance checklist

Each row is verified by the automated axe matrix (desktop + mobile × light +
dark) plus the manual keyboard / screen-reader walkthrough recorded during
this milestone. ✓ = pass, n/a = SC does not apply to that route.

| Route                       | 1.1.1 alt text | 1.3.1 structure | 1.4.3 contrast | 1.4.4 zoom 200% | 1.4.10 reflow 320px | 1.4.12 spacing | 2.1.1 keyboard | 2.4.1 skip link | 2.4.3 focus order | 2.4.7 focus visible | 3.3.1/2 forms | 4.1.2 name/role | 4.1.3 status |
| --------------------------- | -------------- | ---------------- | ---------------- | ----------------- | --------------------- | ---------------- | ----------------- | -------------- | ------------------ | ------------------- | --------------- | ----------------- | -------------- |
| `/` landing                 | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | n/a             | ✓                 | ✓              |
| `/sign-in`, `/sign-up`      | ✓              | ✓                | ✓ (Clerk theme)  | ✓                 | ✓                     | ✓                | ✓                 | n/a (page-level) | ✓                | ✓                   | ✓ (Clerk)       | ✓                 | ✓              |
| `/dashboard`                | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | n/a             | ✓                 | ✓ (toast live) |
| `/tenders`                  | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | ✓ (search, dialog) | ✓             | ✓ (aria-live total) |
| `/tenders/:id`              | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | ✓ (uploads)     | ✓                 | ✓ (aria-busy)  |
| `/profile`                  | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | ✓ (auto-IDs)    | ✓                 | ✓              |
| `/admin`                    | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓                 | ✓              | ✓                  | ✓                   | n/a             | ✓                 | ✓ (aria-busy)  |
| `*` not-found               | ✓              | ✓                | ✓                | ✓                 | ✓                     | ✓                | ✓ (no controls)   | n/a            | n/a                | n/a                 | n/a             | ✓                 | ✓              |

Manual keyboard walkthrough (verified once per route): Tab order is logical,
focus is always visible, the skip link is the first focusable element on
shells that have one, all interactive controls are reachable and operable
with keyboard alone, and Esc closes dialogs/menus.

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
