import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const PUBLIC_ROUTES = [
  { name: "landing", path: "/tenderai/" },
  { name: "not-found", path: "/tenderai/__definitely-missing__" },
];

// Authenticated routes require Clerk session and are scanned only when
// PLAYWRIGHT_AUTH_STORAGE points to a saved storageState JSON. Otherwise they
// are skipped so the public-route gate keeps working in CI without secrets.
const AUTH_ROUTES = [
  { name: "dashboard", path: "/tenderai/dashboard" },
  { name: "tenders", path: "/tenderai/tenders" },
  { name: "profile", path: "/tenderai/profile" },
];

for (const route of PUBLIC_ROUTES) {
  test(`a11y: ${route.name} has zero serious/critical WCAG 2.1 AA violations`, async ({
    page,
  }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(WCAG_AA_TAGS)
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      blocking,
      `serious/critical violations on ${route.path}:\n` +
        JSON.stringify(blocking, null, 2),
    ).toEqual([]);
  });
}

test("a11y: a skip link is present and routes focus to the main landmark", async ({
  page,
}) => {
  // The landing route renders nothing useful when Clerk is not configured for
  // the current host (publishableKeyFromHost(localhost) → undefined), and the
  // proxied REPLIT_DEV_DOMAIN where Clerk works requires mTLS that this raw
  // Playwright run cannot speak. We therefore drive the test via
  // PLAYWRIGHT_LANDING_URL when set, else skip and rely on the runTest harness
  // (which uses the proxy) to validate this behaviour.
  const url = process.env.PLAYWRIGHT_LANDING_URL;
  test.skip(!url, "Set PLAYWRIGHT_LANDING_URL to a host where Clerk is configured.");
  await page.goto(url!, { waitUntil: "networkidle" });

  const skip = page.locator("a.skip-link").first();
  await skip.waitFor({ state: "attached", timeout: 5000 });
  await expect(skip).toHaveAttribute("href", /^#/);
  await expect(skip).toHaveText(/Skip to main content/i);

  const targetId = (await skip.getAttribute("href"))!.slice(1);
  await expect(page.locator(`#${targetId}`)).toHaveCount(1);

  await skip.focus();
  await page.keyboard.press("Enter");
  const focusedId = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.id ?? null,
  );
  expect(focusedId).toBe(targetId);
});

test("a11y: prefers-reduced-motion collapses transitions", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Only run in chromium");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tenderai/", { waitUntil: "networkidle" });
  const duration = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.transition = "opacity 1s ease";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).transitionDuration;
    probe.remove();
    return computed;
  });
  // Our @media (prefers-reduced-motion: reduce) rule pins durations to 0.01ms.
  // Browsers may serialise that as "0.01ms", "1e-05s", or "0s" depending on engine.
  const seconds = parseFloat(duration);
  expect(Number.isFinite(seconds)).toBe(true);
  expect(seconds).toBeLessThanOrEqual(0.001);
});

test.describe("authenticated routes", () => {
  test.skip(
    !process.env.PLAYWRIGHT_AUTH_STORAGE,
    "Set PLAYWRIGHT_AUTH_STORAGE to a Clerk storageState JSON to enable.",
  );
  test.use({ storageState: process.env.PLAYWRIGHT_AUTH_STORAGE });
  for (const route of AUTH_ROUTES) {
    test(`a11y: ${route.name} has zero serious/critical WCAG 2.1 AA violations`, async ({
      page,
    }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      const results = await new AxeBuilder({ page })
        .withTags(WCAG_AA_TAGS)
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        blocking,
        `serious/critical violations on ${route.path}:\n` +
          JSON.stringify(blocking, null, 2),
      ).toEqual([]);
    });
  }
});
