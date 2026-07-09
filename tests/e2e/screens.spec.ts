import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Authenticated, non-destructive per-screen checks: each screen renders its key
// content, produces no console errors, and a screenshot is saved as evidence.
// Requires the "setup" project to have logged in (TEST_EMAIL / TEST_PASSWORD).

const SCREENS = [
  { name: "home", path: "/", visible: /バーチャルオフィス/ },
  { name: "office", path: "/office", visible: /バーチャルオフィス/ },
  { name: "forest", path: "/forest", visible: /.+/ },
  { name: "tasks", path: "/tasks", visible: /.+/ },
  { name: "tasks-mail", path: "/tasks/mail", visible: /メール共有の設定/ },
  { name: "assistant", path: "/assistant", visible: /AI内田さん/ },
];

for (const s of SCREENS) {
  test(`screen ${s.name} (${s.path}) renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(String(e)));

    const resp = await page.goto(s.path, { waitUntil: "networkidle" });
    expect(resp?.status(), `HTTP status for ${s.path}`).toBeLessThan(400);
    // Must not be bounced to /login (i.e. the session is valid).
    expect(page.url(), "should not redirect to /login").not.toContain("/login");
    await expect(page.getByText(s.visible).first()).toBeVisible({ timeout: 15000 });

    fs.mkdirSync(`evidence/${s.name}/screenshots`, { recursive: true });
    await page.screenshot({ path: `evidence/${s.name}/screenshots/after.png` });
    fs.writeFileSync(`evidence/${s.name}/console.json`, JSON.stringify({ errors }, null, 2));
    expect(errors, `console errors on ${s.path}`).toEqual([]);
  });
}
