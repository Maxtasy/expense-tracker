// Records the teaser video clips (see docs/teaser-video.md for the script).
// Playwright isn't a project dependency; install it temporarily and point at a Chromium:
//   npm i --no-save playwright-core
//   npm run db:seed-demo   (then mark the demo user onboarded + email-verified, theme dark)
//   CHROMIUM_PATH=<path to chrome.exe> node --env-file=.env.local scripts/record-teaser.mjs
// Needs the dev server running on :3000. Writes docs/media/teaser-raw.webm (not committed);
// convert with ffmpeg as described in the doc.
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync, renameSync } from "fs";
import { homedir } from "os";

const OUT = process.env.OUT_DIR ?? "docs/media";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const exe = process.env.CHROMIUM_PATH ?? `${homedir()}/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en",
  recordVideo: { dir: OUT, size: { width: 780, height: 1688 } },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

// ---- login (demo account from .env.local; not echoed) ----
await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill(process.env.DEMO_ACCOUNT_EMAIL);
await page.getByLabel("Password").fill(process.env.DEMO_ACCOUNT_PASSWORD);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/dashboard");
await page.addStyleTag({ content: "*{caret-color:transparent}" });

// ---- caption overlay ----
async function caption(text) {
  await page.evaluate((text) => {
    let el = document.getElementById("teaser-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "teaser-caption";
      el.style.cssText =
        "position:fixed;left:16px;right:16px;bottom:96px;z-index:2147483000;padding:12px 16px;border-radius:12px;" +
        "background:var(--color-surface);color:var(--color-fg);border:1px solid var(--color-border);" +
        "font:600 16px/1.3 var(--font-geist-sans),system-ui,sans-serif;letter-spacing:-0.01em;text-align:center;" +
        "opacity:0;transition:opacity .4s";
      document.body.appendChild(el);
    }
    el.textContent = text;
    requestAnimationFrame(() => (el.style.opacity = "1"));
  }, text);
}
async function hideCaption() {
  await page.evaluate(() => {
    const el = document.getElementById("teaser-caption");
    if (el) el.style.opacity = "0";
  });
}

const t0 = Date.now();
const mark = (label) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${label}`);

// 1. overview
await page.goto(`${BASE}/dashboard`);
await wait(600);
await caption("See where your money goes.");
mark("1 overview");
await wait(3000);
await hideCaption();
await wait(400);

// 2. add transaction
mark("2 add");
await caption("Log an expense in seconds.");
const fab = page.getByRole("button", { name: "Add transaction" });
await fab.click();
await wait(900);
const dialog = page.locator("dialog[open]");
await dialog.locator('input[name="amount"]').pressSequentially("12.50", { delay: 140 });
await wait(300);
await dialog.locator('select[name="categoryId"]').selectOption({ label: "Food" });
await wait(300);
await dialog.locator('input[name="description"]').pressSequentially("Lunch", { delay: 120 });
await wait(600);
await dialog.getByRole("button", { name: "Add", exact: true }).click();
await page.waitForSelector("dialog[open]", { state: "detached", timeout: 8000 }).catch(() => {});
await wait(2200);
await hideCaption();
await wait(400);

// 3. recurring
mark("3 recurring");
await page.goto(`${BASE}/dashboard/recurring`);
await wait(500);
await caption("Set rent and salary once.");
await wait(3600);
await hideCaption();
await wait(400);

// 4. insights
mark("4 insights");
await page.goto(`${BASE}/dashboard/insights`);
await wait(500);
await caption("Know what each category costs.");
await wait(4300);
await hideCaption();
await wait(400);

// 5. settings: light theme
mark("5 theme");
await page.goto(`${BASE}/dashboard/settings`);
await wait(600);
await caption("Dark, light, or match your system.");
await wait(900);
const themeSelect = page.getByLabel("Appearance");
await themeSelect.scrollIntoViewIfNeeded();
await wait(500);
await themeSelect.selectOption("light");
await wait(2800);
await hideCaption();

// 6. end card
mark("6 end card");
await page.evaluate(() => {
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;" +
    "background:var(--color-background);color:var(--color-fg);opacity:0;transition:opacity .4s;" +
    "font:600 28px/1.2 var(--font-geist-sans),system-ui,sans-serif;letter-spacing:-0.02em";
  el.innerHTML =
    '<svg width="96" height="96" viewBox="0 0 48 48" fill="none" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M13 12H35" style="stroke:var(--logo-mint)"/><path d="M8 24H40" style="stroke:var(--logo-sky)"/><path d="M8 36H40" style="stroke:var(--logo-indigo)"/></svg>' +
    '<div>Expense Tracker</div><div style="font-size:16px;font-weight:500;color:var(--color-fg-muted);letter-spacing:0">Free. No ads.</div>';
  document.body.appendChild(el);
  requestAnimationFrame(() => (el.style.opacity = "1"));
});
await wait(3200);
mark("end");

// reset the demo account's theme so re-runs start dark
await page.evaluate(() => document.getElementById("teaser-caption")?.remove());
await context.close();
await browser.close();

const webm = readdirSync(OUT).find((f) => f.endsWith(".webm"));
renameSync(`${OUT}/${webm}`, `${OUT}/teaser-raw.webm`);
console.log("saved", `${OUT}/teaser-raw.webm`);
