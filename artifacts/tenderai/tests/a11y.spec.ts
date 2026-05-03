import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// In the Replit dev preview the artifact is mounted at /tenderai by the
// path-based proxy, but the local Vite dev server hosts the SPA at the root
// (BASE_PATH=/). Tests hit the dev server directly so paths are relative to
// the root.
const PUBLIC_ROUTES = [
  { name: "landing", path: "/" },
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
  { name: "not-found", path: "/__definitely-missing__" },
];

// Authenticated routes are scanned via the in-app A11y bypass set by the
// init script below. SignedIn renders shell unconditionally and ClerkProvider
// is skipped when window.__E2E_A11Y__ === true.
const AUTH_ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "tenders", path: "/tenders" },
  { name: "tender-detail", path: "/tenders/1" },
  { name: "profile", path: "/profile" },
  { name: "admin", path: "/admin" },
];

async function runAxe(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  const results = await new AxeBuilder({ page })
    .withTags(WCAG_AA_TAGS)
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    blocking,
    `serious/critical violations on ${path}:\n` +
      JSON.stringify(blocking, null, 2),
  ).toEqual([]);
}

for (const route of PUBLIC_ROUTES) {
  test(`a11y(public): ${route.name}`, async ({ page }) => {
    await runAxe(page, route.path);
  });
}

test.describe("authenticated routes (a11y bypass)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __E2E_A11Y__: boolean }).__E2E_A11Y__ = true;
    });
  });

  for (const route of AUTH_ROUTES) {
    test(`a11y(auth): ${route.name}`, async ({ page }) => {
      await runAxe(page, route.path);
      // Confirm we actually rendered the protected shell, not NotFound.
      await expect(page.locator("main#main-content")).toHaveCount(1);
      await expect(page.locator("a.skip-link")).toHaveCount(1);
    });
  }
});

test("a11y: a skip link is present and routes focus to the main landmark", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __E2E_A11Y__: boolean }).__E2E_A11Y__ = true;
  });
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  const skip = page.locator("a.skip-link").first();
  await skip.waitFor({ state: "attached", timeout: 5000 });
  await expect(skip).toHaveAttribute("href", /^#main-content$/);
  await expect(skip).toHaveText(/Skip to main content/i);
  await skip.focus();
  await page.keyboard.press("Enter");
  const focusedId = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.id ?? null,
  );
  expect(focusedId).toBe("main-content");
});

test("a11y: banner, nav, main and contentinfo landmarks exist on the app shell", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { __E2E_A11Y__: boolean }).__E2E_A11Y__ = true;
  });
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("a11y: prefers-reduced-motion collapses transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const seconds = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.transition = "opacity 1s ease";
    document.body.appendChild(probe);
    const raw = getComputedStyle(probe).transitionDuration.trim();
    probe.remove();
    if (raw.endsWith("ms")) return parseFloat(raw) / 1000;
    if (raw.endsWith("s")) return parseFloat(raw);
    return Number.NaN;
  });
  expect(Number.isFinite(seconds)).toBe(true);
  expect(seconds).toBeLessThanOrEqual(0.001);
});
