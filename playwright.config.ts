import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load E2E credentials/config from a gitignored .env.test (so passwords never
// land in shell history or the repo). Copy .env.test.example to get started.
dotenv.config({ path: ".env.test" });

// Target: production by default; override with E2E_BASE_URL for a preview/local.
const baseURL = process.env.E2E_BASE_URL || "https://manage-task-drab.vercel.app";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "evidence/e2e/report", open: "never" }]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    // No login needed — runnable by anyone (verifies the auth gate + public pages).
    { name: "public", testMatch: /public\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    // Log in once (needs TEST_EMAIL / TEST_PASSWORD), reuse the session below.
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    {
      name: "authed",
      testMatch: /screens\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "tests/.auth/state.json" },
    },
  ],
});
