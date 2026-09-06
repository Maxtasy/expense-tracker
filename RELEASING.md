# Releasing

How to ship a new version of this app, including to the Android app on Google Play (published via PWABuilder as a TWA — see CLAUDE.md's PWA section for the packaging background).

## What "version" means here

`package.json`'s `version` (semver, e.g. `1.2.0`) is the source of truth. It's shown in-app on the Settings page footer, imported directly from `package.json` — there's no second place to edit it.

Play Console additionally needs its own:

- **`versionCode`** — a plain integer that must strictly increase on every upload. Unrelated to semver; tracked only in this file's release history table below, since Play Console is the only other place it's visible.
- **`versionName`** — free text shown to users in the Play Store. Convention so far: `"{semver}.0"` (e.g. `"1.2.0.0"`), an artifact of PWABuilder's default format.

## Which track

As of 1.2.0, the app has never been promoted out of the **Internal testing** track — Play Console's Production track is still inactive. Keep releasing to Internal testing until there's a deliberate decision to promote to Production (a bigger, separate step — don't do it as a side effect of a routine release).

## Steps

1. Bump `package.json`'s `version`.
2. Implement/verify the feature itself; commit.
3. Push to `main` (auto-deploys to Vercel — the live web app updates immediately; this alone is enough for anyone not using the Android app).
4. Check the last row of the release history table below for the last `versionCode`; the new one is `+1`.
5. Go to [pwabuilder.com](https://www.pwabuilder.com) → enter the production URL (`https://expense-tracker-rose-ten-25.vercel.app`) → "Package for Stores" → Android → set `versionName` to `"{semver}.0"` and `versionCode` to the incremented value → **upload the existing signing keystore rather than letting it generate a new one** (a new key breaks Play Console's signature match on an update — Play Console will reject the upload).
6. Download the package zip and extract the `.aab`.
7. **Before uploading, verify the signing certificate matches what Play Console expects** — this caught a real mistake during the 1.2.0 release (the wrong keystore file was picked in PWABuilder's file dialog, silently, since the dialog only shows a filename). Extract the cert fingerprint locally with no password needed:
   ```bash
   unzip -o Expenses.apk "META-INF/*.RSA" -d extracted
   openssl pkcs7 -in extracted/META-INF/*.RSA -inform DER -print_certs | openssl x509 -noout -fingerprint -sha1
   ```
   Compare against Play Console's **Setup → App integrity → Upload key certificate** (the *upload* one, not the app signing one — see the glossary below; this is what Play Console actually checks against on upload, and is also the SHA1 shown in the "wrong key" error message if you've already tried uploading once). If they don't match, you grabbed the wrong keystore file — go back to step 5 and re-check which file you selected.
8. Play Console → the active track (Internal testing, per above) → create release → upload the verified `.aab` → release notes → review → roll out.
9. Spot check `public/.well-known/assetlinks.json`'s fingerprint against Play Console's **Setup → App integrity → App signing key certificate** (the *app signing* one — see glossary below). It shouldn't normally change between releases — only touch this file if it actually mismatches. If the Android app starts showing a browser URL bar instead of running full-screen, that's Digital Asset Links verification failing — almost always this file holding the wrong fingerprint (commonly: someone pasted the *Upload* key's SHA-256 here instead of the *App signing* key's). Verify what's actually live with `curl -s https://expense-tracker-rose-ten-25.vercel.app/.well-known/assetlinks.json` and compare directly against Play Console before assuming the deploy is stale.
10. Add a row to the table below (date, semver, versionCode, versionName, track, notes); commit.

### Upload key vs. App signing key — don't mix these up

Play Console's **Setup → App integrity** page shows two different certificates, each with its own SHA-1 *and* SHA-256 fingerprint. They serve different purposes and are used in different places in this workflow:

| | **Upload key certificate** | **App signing key certificate** |
|---|---|---|
| What it is | The keystore file on your machine, used to sign the `.aab` before uploading | Google's own key, used to re-sign the app before it reaches devices (mandatory since Google Play App Signing) |
| Used for | Step 7 above — confirms you picked the right local keystore file before uploading | Step 9 above — `public/.well-known/assetlinks.json`'s `sha256_cert_fingerprints` must match this one, since it's what's actually installed on devices |
| Fingerprint format needed | SHA-1 (step 7's `openssl` command outputs SHA-1) | SHA-256 (colon-separated hex, straight into the JSON array) |
| Wrong one used → symptom | Play Console rejects the upload outright with a clear error | No error anywhere — the app just silently falls back to showing a browser URL bar instead of running full-screen, since Digital Asset Links verification fails quietly |

**Rule of thumb:** anything about *uploading* → Upload key. Anything about *assetlinks.json / what's installed on a device* → App signing key.

## Release history

| Date | semver (package.json) | versionCode | versionName | Track | Notes |
|---|---|---|---|---|---|
| 2026-09-05 | 0.1.0 *(not bumped at the time)* | 1 | 1.0.0.0 | Internal testing | First Play Store upload (M14) |
| 2026-09-05 | 1.2.0 | 2 | 1.2.0.0 | Internal testing | Swipe-to-paginate month on the dashboard overview; first release to follow this doc. Hit the wrong-keystore mistake step 7 now guards against — first attempt was rejected by Play Console, caught and fixed before a second upload. |
| 2026-09-05 | 1.3.0 | 3 | 1.3.0.0 | Internal testing | Whole-page swipe navigation fix, loading indicator on pagination/navigation, currency symbols + per-user currency setting, tablet layout, confirmed Vercel PR previews. `assetlinks.json`'s SHA256 fingerprint had actually changed since 1.2.0 (not just the usual App Signing re-sign note) — updated to match Play Console's App signing key certificate. |
