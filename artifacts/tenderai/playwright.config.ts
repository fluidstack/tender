import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "20547";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 1,
  timeout: 90_000,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "off",
  },
  projects: [
    {
      name: "desktop-light",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "desktop-dark",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "mobile-light",
      use: {
        ...devices["Pixel 5"],
        colorScheme: "light",
      },
    },
    {
      name: "mobile-dark",
      use: {
        ...devices["Pixel 5"],
        colorScheme: "dark",
      },
    },
    {
      // Explicit 375px CSS-width project to match the WCAG 2.1 1.4.10 reflow
      // acceptance criterion (smallest common iPhone width). We deliberately
      // use Chromium (not WebKit) here because the sandbox only ships Chromium.
      name: "mobile-375-light",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "light",
        viewport: { width: 375, height: 667 },
        isMobile: false,
        hasTouch: true,
      },
    },
    {
      name: "mobile-375-dark",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        viewport: { width: 375, height: 667 },
        isMobile: false,
        hasTouch: true,
      },
    },
  ],
});
