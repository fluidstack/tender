# Accessibility

Project-level accessibility statements live alongside the artifact they describe.

- **TenderAI web app** (artifacts/tenderai): see
  [`artifacts/tenderai/docs/accessibility.md`](../artifacts/tenderai/docs/accessibility.md)
  for the WCAG 2.1 AA conformance statement, AT compatibility matrix, and
  known limitations.

Automated accessibility tests for TenderAI live in
`artifacts/tenderai/tests/a11y.spec.ts` and run via:

```
pnpm --filter @workspace/tenderai run test:a11y
```

The suite uses `@axe-core/playwright` and fails on any axe violation with
impact `serious` or `critical` against the WCAG 2.0/2.1 A and AA tags. By
default it scans the public routes (landing, 404). To include authenticated
routes (`dashboard`, `tenders`, `profile`), export a Clerk-authenticated
Playwright storageState JSON and set `PLAYWRIGHT_AUTH_STORAGE` to its path.
