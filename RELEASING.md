# Releasing

How to ship a new version of this app, including to the Android app on Google Play (published via PWABuilder as a TWA — see CLAUDE.md's PWA section for the packaging background).

## What "version" means here

`package.json`'s `version` (semver, e.g. `1.2.0`) is the source of truth. It's shown in-app on the Settings page footer, imported directly from `package.json` — there's no second place to edit it.

Play Console additionally needs its own:

- **`versionCode`** — a plain integer that must strictly increase on every upload. Unrelated to semver; tracked only in this file's release history table below, since Play Console is the only other place it's visible.
- **`versionName`** — free text shown to users in the Play Store. Convention so far: `"{semver}.0"` (e.g. `"1.2.0.0"`), an artifact of PWABuilder's default format.

## Which track

As of 1.2.0, the app has never been promoted out of the **Internal testing** track — Play Console's Production track is still inactive. Keep releasing to Internal testing until there's a deliberate decision to promote to Production (a bigger, separate step — don't do it as a side effect of a routine release).

## Do you even need to repackage for Android?

Usually no. The Android app is a **TWA (Trusted Web Activity)** — a thin native shell that verifies it's allowed to display the production URL full-screen (via `assetlinks.json`), then just loads `https://expense-tracker-rose-ten-25.vercel.app`, same as a browser tab. The service worker only caches `/_next/static/*` and `/icons/*`, never page content (deliberately — see CLAUDE.md's PWA section), so there is no page/feature code baked into the installed package at all. The moment `main` deploys, every install — web tab or Android shell — is already showing it.

So steps 4–9 below (PWABuilder repackage + Play Console upload) are only worth doing when something actually lives in the native package rather than being fetched live:

- **The Play Store listing's version number.** `versionCode`/`versionName` are metadata Play Console displays and enforces strictly-increasing on upload — cosmetic/record-keeping, nothing on-device depends on it. Skipping an upload just means the Play Store page shows an older version number than what's actually running.
- **App icon, splash screen, or other manifest bits PWABuilder bakes in at packaging time.** Editing `icon.svg` and running `icons:build` updates the *web* icon immediately; the installed Android icon only updates on the next repackage.
- **`assetlinks.json`'s trust relationship.** This is a native-side prerequisite for full-screen mode, not something a web deploy can fix if it breaks (see the 2026-09-06 incident below) — but it also doesn't need a new upload on every release, just when the fingerprint itself changes.
- **Google Play's periodic target-SDK requirements.** Play eventually forces a re-upload regardless of feature parity, to keep targeting a current Android API level, or risks the app being pulled from new installs.

If a release doesn't touch any of those, it's reasonable to stop after step 3 and record the release as web-only in the table below (see the 1.4.0 row) — the Android app already has the update either way.

## Branching model

`main` always reflects what's actually live (web app *and* whatever's published on Play Store) — it should never be ahead of what users are running. Day-to-day work happens on a long-lived **`develop`** branch instead of `main` directly:

- Feature/fix branches → PR into `develop`, not `main`. Each PR still gets its own Vercel preview deployment.
- `develop` itself also gets a standing Vercel preview (Vercel deploys every pushed branch, not just PRs) — use its URL as a staging environment to see the accumulated batch of features together before releasing.
- When everything planned for a release is merged into `develop` and looks right on its preview: open a PR from `develop` → `main`, merge it, then follow the release steps below starting from the version bump.

**Database split (as of 2026-09):** dev and prod are separate Supabase projects — `develop` and every PR preview run against a dedicated dev database (Vercel's Preview environment), only `main`'s Production deployment touches the real one. A schema change tried out on `develop` is no longer live for real users. It does mean a migration needs to be applied **twice**: once locally against the dev DB while building the feature, and once against the prod DB as part of shipping the release (step 2 below) — `npm run db:migrate` reads whatever's in `.env.local`, so switch its `DATABASE_URL`/`DATABASE_URL_MIGRATIONS` to the prod project's connection strings temporarily (or pass them inline) for that second run, then switch back.

## Steps

1. Confirm everything intended for this release is merged into `develop` and its Vercel preview looks right.
2. If this release added any Drizzle migrations, apply them to the **prod** database now — they've only ever run against the dev DB so far. Temporarily point `.env.local`'s `DATABASE_URL`/`DATABASE_URL_MIGRATIONS` at the prod project's connection strings, run `npm run db:migrate`, then switch `.env.local` back to the dev project's strings.
3. Add an entry to `src/content/changelog.ts` (newest first) describing what shipped, in plain user-facing language — this is what renders on the public `/changelog` page. Skip internal refactors/chores; only list things a user would actually notice. Do this as part of the same `develop`→`main` release PR, not a follow-up (unlike the release-history table below, which does lag by one cycle).
4. Bump `package.json`'s `version` (as the last commit on `develop` before releasing).
5. Open a PR from `develop` → `main` and merge it (a regular merge commit, not squash, so `main`'s history keeps each feature's commit individually visible — the feature branches were already squashed going into `develop`) — **this is what actually deploys to Vercel production**, updating the live web app immediately; this alone is enough for anyone not using the Android app. Then tag the resulting commit on `main` so there's a durable pointer to what shipped, independent of the table below:
   ```bash
   git checkout main && git pull
   git tag -a v{semver} -m "v{semver}: <short summary of what shipped>"
   git push origin v{semver}
   ```
6. Decide whether this release actually needs an Android repackage (see "Do you even need to repackage for Android?" above) — if not, skip to step 12 and record it as web-only. Otherwise, check the last row of the release history table below for the last `versionCode`; the new one is `+1`.
7. Go to [pwabuilder.com](https://www.pwabuilder.com) → enter the production URL (`https://expense-tracker-rose-ten-25.vercel.app`) → "Package for Stores" → Android → set `versionName` to `"{semver}.0"` and `versionCode` to the incremented value → **upload the existing signing keystore rather than letting it generate a new one** (a new key breaks Play Console's signature match on an update — Play Console will reject the upload).
8. Download the package zip and extract the `.aab`.
9. **Before uploading, verify the signing certificate matches what Play Console expects** — this caught a real mistake during the 1.2.0 release (the wrong keystore file was picked in PWABuilder's file dialog, silently, since the dialog only shows a filename). Extract the cert fingerprint locally with no password needed:
   ```bash
   unzip -o Expenses.apk "META-INF/*.RSA" -d extracted
   openssl pkcs7 -in extracted/META-INF/*.RSA -inform DER -print_certs | openssl x509 -noout -fingerprint -sha1
   ```
   Compare against Play Console's **Protected with Play → Play Store protection → Manage Play App signing → Upload key certificate** (the *upload* one, not the app signing one — see the glossary below; this is what Play Console actually checks against on upload, and is also the SHA1 shown in the "wrong key" error message if you've already tried uploading once). If they don't match, you grabbed the wrong keystore file — go back to step 7 and re-check which file you selected.
10. Play Console → the active track (Internal testing, per above) → create release → upload the verified `.aab` → release notes → review → roll out.
11. Spot check `public/.well-known/assetlinks.json` against Play Console's own **Digital Asset Links JSON** snippet, found on that same **Manage Play App signing** page (scroll below the certificates). **Copy that snippet directly rather than retyping a fingerprint by hand** — that's what caused the 2026-09-06 incident below: someone copied the *Upload key certificate*'s SHA-256 into this file instead of using the ready-made snippet, which already has the correct *App signing key* fingerprint baked in. The file shouldn't normally need to change between releases at all. If the Android app starts showing a browser URL bar instead of running full-screen, that's Digital Asset Links verification failing — check this file first. Verify what's actually live with `curl -s https://expense-tracker-rose-ten-25.vercel.app/.well-known/assetlinks.json` and diff it against Play Console's snippet directly, character for character, before assuming anything else is wrong.
12. Add a row to the table below (date, semver, versionCode, versionName, track, notes); commit.

### Upload key vs. App signing key — don't mix these up

Play Console's app-signing page (currently at **Protected with Play → Play Store protection → Manage Play App signing** — Google has moved this at least twice, so if this path is stale, use Play Console's own search bar for "app signing" or "signing key" to find it) shows two different certificates, each with its own MD5/SHA-1/SHA-256 fingerprint. They serve different purposes and are used in different places in this workflow:

| | **Upload key certificate** | **App signing key certificate** |
|---|---|---|
| What it is | The keystore file on your machine, used to sign the `.aab` before uploading | Google's own key, used to re-sign the app before it reaches devices (mandatory since Google Play App Signing) |
| Used for | Step 7 above — confirms you picked the right local keystore file before uploading | Step 9 above — `public/.well-known/assetlinks.json`'s `sha256_cert_fingerprints` must match this one, since it's what's actually installed on devices |
| Fingerprint format needed | SHA-1 (step 7's `openssl` command outputs SHA-1) | SHA-256 (colon-separated hex, straight into the JSON array) |
| Wrong one used → symptom | Play Console rejects the upload outright with a clear error | No error anywhere — the app just silently falls back to showing a browser URL bar instead of running full-screen, since Digital Asset Links verification fails quietly |

**Rule of thumb:** anything about *uploading* → Upload key. Anything about *assetlinks.json / what's installed on a device* → App signing key. **Best of all: don't hand-copy a fingerprint into `assetlinks.json` at all** — Play Console's "Manage Play App signing" page provides a ready-made, already-correct Digital Asset Links JSON snippet; copy that whole snippet instead.

## Release history

| Date | semver (package.json) | versionCode | versionName | Track | Notes |
|---|---|---|---|---|---|
| 2026-09-05 | 0.1.0 *(not bumped at the time)* | 1 | 1.0.0.0 | Internal testing | First Play Store upload (M14) |
| 2026-09-05 | 1.2.0 | 2 | 1.2.0.0 | Internal testing | Swipe-to-paginate month on the dashboard overview; first release to follow this doc. Hit the wrong-keystore mistake step 7 now guards against — first attempt was rejected by Play Console, caught and fixed before a second upload. |
| 2026-09-05 | 1.3.0 | 3 | 1.3.0.0 | Internal testing | Whole-page swipe navigation fix, loading indicator on pagination/navigation, currency symbols + per-user currency setting, tablet layout, confirmed Vercel PR previews. |
| 2026-09-06 | 1.3.0 *(web-only fix, no new Play Store upload)* | — | — | — | `public/.well-known/assetlinks.json` was mistakenly updated with the **Upload key certificate**'s SHA-256 instead of the **App signing key certificate**'s during the 1.3.0 release above, breaking the Android app's full-screen mode (it fell back to showing a browser URL bar). Reverted to the correct fingerprint, confirmed against Play Console's own ready-made Digital Asset Links JSON snippet. Docs above rewritten to point at this snippet directly instead of a hand-copied fingerprint, and to the current Play Console path (**Protected with Play → Play Store protection → Manage Play App signing** — moved at least twice now). |
| 2026-09-08 | 1.4.0 *(web only so far — Android publish pending)* | — | — | — | Add/edit transaction, add category, and add recurring transaction all moved into modals (fixed bottom-right plus button); Insights gained a horizontal bar breakdown per category, shown before the pie charts; fixed low-contrast primary button and missing input labels/icon-button touch targets (a11y); added a free/ad-free line to the landing page hero; adjacent month now prefetches on idle in the dashboard pager. Tagged `v1.4.0` on `main` — first release to follow the tagging step documented above. |
| 2026-09-09 | 1.5.0 *(web only — no Android repackage needed, nothing in this release touches the native package)* | — | — | — | New "Import from Money Manager" flow in Settings: brings in transaction history from a Money Manager `.xlsx` export, merging into existing data with a category review/mapping step and a dedup guard on re-import. Also: the current month/year label now centers correctly when it wraps to two lines on narrow screens (Overview + Insights pagers), and buttons show a pointer cursor. Tagged `v1.5.0` on `main`. |
| 2026-09-09 | 1.6.0 *(web only — no Android repackage needed, nothing in this release touches the native package)* | — | — | — | Loading indicator on delete buttons (transactions, categories, recurring transactions); recurring-transaction edit moved into a modal; fixed deleting a single materialized recurring occurrence regenerating itself on revisit, and deleting a recurring rule now also removes its future occurrences while keeping past ones; Insights split into an Expenses/Income toggle instead of always showing both side by side; category color picker (personal categories); ability to hide default categories (per-user, reversible, never deletes the shared category); landing page gained a "What's next" roadmap section and a feedback contact card. Tagged `v1.6.0` on `main`. |
| 2026-09-10 | 1.7.0 *(web only — no Android repackage needed, nothing in this release touches the native package)* | — | — | — | Localization: `next-intl` with a per-user locale setting (Settings, mirrors the currency setting) translating the whole authenticated dashboard app into English, German, Spanish, French, and Portuguese, including Server Action error/validation messages. Money now formats via `Intl.NumberFormat` (fixes zero-decimal currencies like JPY/KRW always showing two decimals) and dates via `Intl.DateTimeFormat`, both locale-aware. Landing page, `/login`, `/signup`, and `/privacy` intentionally stay English-only — landing/login/signup localization is planned for v1.8.0, the privacy page stays English-only indefinitely for now (legal copy, held to a higher translation-accuracy bar). Tagged `v1.7.0` on `main`. |
| 2026-09-10 | 1.8.0 *(web only — no Android repackage needed, nothing in this release touches the native package)* | — | — | — | Insights gained per-period totals in the "Expenses/Income by category" headline and the Expenses/Income toggle moved to the very top of the page (also fixed a stale-highlight bug on both Insights toggles caused by `next/link`'s router cache, switched to plain anchors). New visual language: income stays the existing accent blue, expense actions (transaction/recurring/category type toggles, the Insights tab) get their own amber color via new `--color-expense` design tokens. New Settings "Start fresh" action — deletes all transactions and recurring rules (categories untouched), gated behind a modal requiring both a confirmation checkbox and typing `DELETE`. Landing page, `/login`, and `/signup` are now localized to all 5 supported locales via a new cookie-based pre-auth locale switcher (`/privacy` still stays English-only indefinitely, per the v1.7.0 note above). Tagged `v1.8.0` on `main`. |
| 2026-09-11 | 1.9.0 *(web only — no Android repackage needed, nothing in this release touches the native package)* | — | — | — | Change password setting on the Settings page. Loading-spinner feedback (previously only on delete buttons) extended to every action button in the app, including 3 buttons that had no pending feedback at all before (logout, hide category, unhide category) — now documented as the standing pattern in CLAUDE.md. Exported CSV filenames get a `YYYY-MM-DD_HH-MM` timestamp prefix, formatted in the downloading browser's local timezone rather than the server's. Landing page roadmap section generalized ("Be part of the roadmap" instead of naming specific planned features, which had already gone stale once) plus a new small AI-development transparency note. Docs (CLAUDE.md, README) updated to reflect the app's shift from a personal project toward real external users via Google Play Closed testing. Reset-password-email and splitting dev/prod into separate Supabase databases were both explicitly deferred to a future release. Tagged `v1.9.0` on `main`. |
