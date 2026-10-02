// Records the teaser video (see docs/teaser-video.md for the script).
// Playwright isn't a project dependency; install it temporarily and point at a Chromium:
//   npm i --no-save playwright-core
//   npm run db:seed-demo   (then mark the demo user onboarded + email-verified, theme dark)
//   CHROMIUM_PATH=<path to chrome.exe> node --env-file=.env.local scripts/record-teaser.mjs
// Needs the dev server running on :3000. Writes docs/media/teaser-raw.webm (not committed);
// convert with ffmpeg as described in the doc. Re-seed before every take: the run creates a
// category, an expense and an income in the demo account.
import { chromium } from "playwright-core";
import { mkdirSync, readdirSync, renameSync } from "fs";
import { homedir } from "os";

const OUT = process.env.OUT_DIR ?? "docs/media";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const exe = process.env.CHROMIUM_PATH ?? `${homedir()}/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const contextOptions = {
  viewport: { width: 390, height: 844 },
  // Must be 1: with a higher scale factor Playwright draws the page at 1x in the top-left corner of
  // a larger video canvas instead of scaling it to fill the frame.
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: "en",
};

// ---- sign in off camera (demo account from .env.local; not echoed), keep only the session ----
const loginContext = await browser.newContext(contextOptions);
const loginPage = await loginContext.newPage();
await loginPage.goto(`${BASE}/login`);
await loginPage.getByLabel("Email").fill(process.env.DEMO_ACCOUNT_EMAIL);
await loginPage.getByLabel("Password").fill(process.env.DEMO_ACCOUNT_PASSWORD);
await loginPage.getByRole("button", { name: "Log in" }).click();
await loginPage.waitForURL("**/dashboard");
// warm the dev server's compile of every page we'll visit so nothing stalls on camera
for (const path of ["/dashboard/categories", "/dashboard/insights?mode=year&type=income"]) {
  await loginPage.goto(`${BASE}${path}`);
}
const storageState = await loginContext.storageState();
await loginContext.close();

const context = await browser.newContext({
  ...contextOptions,
  storageState,
  recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

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
        "opacity:0;transition:opacity .4s;pointer-events:none";
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
  await wait(400);
}
// Navigation is per page load, so the caption element is recreated after each one.
const goTo = async (linkName) => {
  await page.getByRole("link", { name: linkName, exact: true }).click();
  await page.waitForLoadState("networkidle");
  await wait(400);
};

const t0 = Date.now();
const mark = (label) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${label}`);

async function fillAndAdd(dialog, { amount, category, description }) {
  await dialog.locator('input[name="amount"]').pressSequentially(amount, { delay: 120 });
  await wait(250);
  await dialog.locator('select[name="categoryId"]').selectOption({ label: category });
  await wait(250);
  await dialog.locator('input[name="description"]').pressSequentially(description, { delay: 90 });
  await wait(500);
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await page.waitForSelector("dialog[open]", { state: "detached", timeout: 8000 }).catch(() => {});
  await wait(1800);
}

// 1. overview of a lived-in account
await page.goto(`${BASE}/dashboard`);
await wait(500);
await caption("See where your money goes.");
mark("1 overview");
await wait(3200);
await hideCaption();

// 2. create a category
mark("2 category");
await goTo("Categories");
await caption("Create your own categories.");
await wait(1500);
await page.getByRole("button", { name: "Add category" }).click();
await wait(700);
const categoryDialog = page.locator("dialog[open]");
await categoryDialog.locator('input[name="name"]').pressSequentially("Coffee", { delay: 130 });
await wait(600);
await categoryDialog.getByRole("button", { name: "Add", exact: true }).click();
await page.waitForSelector("dialog[open]", { state: "detached", timeout: 8000 }).catch(() => {});
await wait(2200);
await hideCaption();

// 3. create an expense in the new category
mark("3 expense");
await goTo("Overview");
await caption("Log an expense in seconds.");
await wait(800);
await page.getByRole("button", { name: "Add transaction" }).click();
await wait(700);
await fillAndAdd(page.locator("dialog[open]"), { amount: "4.80", category: "Coffee", description: "Flat white" });
await hideCaption();

// 4. create an income
mark("4 income");
await caption("Track income too.");
await wait(600);
await page.getByRole("button", { name: "Add transaction" }).click();
await wait(700);
const incomeDialog = page.locator("dialog[open]");
await incomeDialog.getByText("Income", { exact: true }).click();
await wait(500);
await fillAndAdd(incomeDialog, { amount: "450", category: "Freelance", description: "Website project" });
await hideCaption();

// 5. insights: month, then the whole year, expenses and income
mark("5 insights");
await goTo("Insights");
await caption("Break any month down by category.");
await wait(3000);
await hideCaption();
await caption("Or see the whole year.");
await page.getByRole("link", { name: "Year", exact: true }).click();
await page.waitForLoadState("networkidle");
await wait(3200);
await hideCaption();
await caption("Compare it with your income.");
await page.getByRole("link", { name: "Income", exact: true }).click();
await page.waitForLoadState("networkidle");
await wait(3200);
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

await context.close();
await browser.close();

const webm = readdirSync(OUT).find((f) => f.endsWith(".webm") && f !== "teaser.webm" && f !== "teaser-raw.webm");
renameSync(`${OUT}/${webm}`, `${OUT}/teaser-raw.webm`);
console.log("saved", `${OUT}/teaser-raw.webm`);
