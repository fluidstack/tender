# Accessibility

Project-level accessibility statements live alongside the artifact they describe.

- **TenderAI web app** (artifacts/tenderai): see
  [`artifacts/tenderai/docs/accessibility.md`](../artifacts/tenderai/docs/accessibility.md)
  for the WCAG 2.1 AA conformance statement, AT compatibility matrix, and
  known limitations.

Automated accessibility tests for TenderAI live in
`artifacts/tenderai/tests/a11y.spec.ts` and run via:

```
PORT=20547 pnpm --filter @workspace/tenderai run test:a11y
```

The suite uses `@axe-core/playwright` and fails on any axe violation with
impact `serious` or `critical` against the WCAG 2.0/2.1 A and AA tags. The
matrix runs against six projects (desktop-light, desktop-dark, mobile-light,
mobile-dark, mobile-375-light, mobile-375-dark — the last two pin a 375×667
viewport for the WCAG 1.4.10 reflow check), giving a 6× matrix per route. See
`artifacts/tenderai/playwright.config.ts` for the live project list.

All public **and** authenticated routes are scanned by default — there is no
opt-in env var. Authenticated routes (`/dashboard`, `/tenders`, `/tenders/:id`,
`/profile`, `/admin`) are rendered deterministically via an in-app a11y
bypass that Playwright sets through `addInitScript`
(`window.__E2E_A11Y__ = true`). When that flag is set, `App` skips
`ClerkProvider`, `SignedIn` always renders its children, and `AppShell`'s
`UserButton` falls back to a labelled placeholder. Each authed test also
asserts that `main#main-content` and `a.skip-link` are present so the suite
fails loudly if the bypass ever silently falls back to the 404 page. The flag
has no effect outside Playwright (it must be set before the SPA bootstraps).
