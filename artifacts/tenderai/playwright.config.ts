import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "20547";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
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
  ],
});
