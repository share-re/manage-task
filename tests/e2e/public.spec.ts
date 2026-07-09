import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Runnable without credentials. Verifies the AuthGate + public pages.

const PROTECTED = ["/office", "/tasks", "/tasks/mail", "/forest", "/assistant"];

for (const path of PROTECTED) {
  test(`unauthenticated ${path} redirects to /login (AuthGate)`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });
}

test("login page renders with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  fs.mkdirSync("evidence/login/screenshots", { recursive: true });
  await page.screenshot({ path: "evidence/login/screenshots/after.png" });
  fs.writeFileSync("evidence/login/console.json", JSON.stringify({ errors }, null, 2));
  expect(errors, "console errors on /login").toEqual([]);
});
