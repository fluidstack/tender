import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Public routes are scanned in every project (desktop/mobile × light/dark).
const PUBLIC_ROUTES = [
  { name: "landing", path: "/tenderai/" },
  { name: "sign-in", path: "/tenderai/sign-in" },
  { name: "sign-up", path: "/tenderai/sign-up" },
  { name: "not-found", path: "/tenderai/__definitely-missing__" },
];

// Authenticated routes require a Clerk session; scanned only when
// PLAYWRIGHT_AUTH_STORAGE points to a saved storageState JSON.
const AUTH_ROUTES = [
  { name: "dashboard", path: "/tenderai/dashboard" },
  { name: "tenders", path: "/tenderai/tenders" },
  { name: "tender-detail", path: "/tenderai/tenders/1" },
  { name: "profile", path: "/tenderai/profile" },
  { name: "admin", path: "/tenderai/admin" },
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
  test(`a11y: ${route.name} has zero serious/critical WCAG 2.1 AA violations`, async ({
    page,
  }) => {
    await runAxe(page, route.path);
  });
}

test("a11y: a skip link is present and routes focus to the main landmark", async ({
  page,
}) => {
  // Clerk's publishableKeyFromHost(localhost) returns no key on plain
  // localhost, so the landing page renders an "Authentication not configured"
  // fallback that contains no shell. Drive this test against a host where
  // Clerk is configured by setting PLAYWRIGHT_LANDING_URL; otherwise skip.
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
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tenderai/", { waitUntil: "networkidle" });
  const seconds = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.transition = "opacity 1s ease";
    document.body.appendChild(probe);
    const raw = getComputedStyle(probe).transitionDuration.trim();
    probe.remove();
    // Normalize "0.01ms", "1e-05s", "0s", "10ms" → seconds.
    if (raw.endsWith("ms")) return parseFloat(raw) / 1000;
    if (raw.endsWith("s")) return parseFloat(raw);
    return Number.NaN;
  });
  expect(Number.isFinite(seconds)).toBe(true);
  // @media (prefers-reduced-motion: reduce) pins durations to ≤ 0.01ms.
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
      await runAxe(page, route.path);
    });
  }
});
