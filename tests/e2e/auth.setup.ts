import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";

const authFile = "tests/.auth/state.json";

// Logs in through the real login form and saves the session. Credentials come
// from env (never hardcoded): TEST_EMAIL / TEST_PASSWORD.
setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set TEST_EMAIL and TEST_PASSWORD to run the authenticated E2E suite " +
        "(e.g. TEST_EMAIL=you@example.com TEST_PASSWORD=... npx playwright test).",
    );
  }
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  // Signed-in users land on /office (the app default).
  await page.waitForURL(/\/office/, { timeout: 20000 });
  fs.mkdirSync("tests/.auth", { recursive: true });
  await page.context().storageState({ path: authFile });
});
