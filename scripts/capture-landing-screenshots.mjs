// Refreshes the phone screenshots from the demo account: the landing page set (public/landing/*-vN.png)
// and the store/README set (public/screenshots/*.png, referenced by the web manifest and the README).
// Same setup as scripts/record-teaser.mjs:
//   npm i --no-save playwright-core
//   npm run db:seed-demo   (then mark the demo user onboarded + email-verified, theme dark)
//   CHROMIUM_PATH=<path to chrome.exe> node --env-file=.env.local scripts/capture-landing-screenshots.mjs
// Needs the dev server running on :3000. Run it on a freshly seeded account, before recording the
// teaser (the teaser run adds a category, an expense and an income).
import { chromium } from "playwright-core";
import { homedir } from "os";

const BASE = "http://localhost:3000";
// Bump when regenerating and update SCREENSHOTS in src/app/page.tsx to match: Next's image cache is
// keyed by URL, so reusing a filename can serve the old picture for hours.
const VERSION = "v3";
const OUT = process.env.OUT_DIR ?? "public/landing";
const exe = process.env.CHROMIUM_PATH ?? `${homedir()}/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe`;

const browser = await chromium.launch({ executablePath: exe, headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "en",
});
// Hide the Next.js dev overlay (error/issue badge) so it never ends up in the footage.
await context.addInitScript(() => {
  const hide = () => {
    const style = document.createElement("style");
    style.textContent = "nextjs-portal { display: none !important; }";
    document.documentElement.appendChild(style);
  };
  if (document.documentElement) hide();
  else document.addEventListener("DOMContentLoaded", hide);
});
const page = await context.newPage();
await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill(process.env.DEMO_ACCOUNT_EMAIL);
await page.getByLabel("Password").fill(process.env.DEMO_ACCOUNT_PASSWORD);
await page.getByRole("button", { name: "Log in" }).click();
await page.waitForURL("**/dashboard");

for (const [name, path] of [
  ["dashboard", "/dashboard"],
  ["insights", "/dashboard/insights"],
  ["settings", "/dashboard/settings"],
]) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}-${VERSION}.png` });
  console.log("saved", `${OUT}/${name}-${VERSION}.png`);
}
// store / README / manifest set (plain filenames: not served through next/image, so no cache suffix)
const STORE_OUT = process.env.STORE_OUT_DIR ?? "public/screenshots";
for (const [name, path] of [
  ["dashboard", "/dashboard"],
  ["insights", "/dashboard/insights"],
  ["categories", "/dashboard/categories"],
  ["recurring", "/dashboard/recurring"],
  ["settings", "/dashboard/settings"],
]) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${STORE_OUT}/${name}.png` });
  console.log("saved", `${STORE_OUT}/${name}.png`);
}
await browser.close();
