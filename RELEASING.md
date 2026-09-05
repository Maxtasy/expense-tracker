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
   Compare against Play Console's **Setup → App integrity → App signing key certificate** (or the SHA1 shown in the "wrong key" error message if you've already tried uploading once). If they don't match, you grabbed the wrong keystore file — go back to step 5 and re-check which file you selected.
8. Play Console → the active track (Internal testing, per above) → create release → upload the verified `.aab` → release notes → review → roll out.
9. Spot check `public/.well-known/assetlinks.json`'s fingerprint (SHA256, a different value from the SHA1 used in step 7) still matches Play Console's App signing key certificate. It shouldn't have changed — only touch this file if it actually mismatches.
10. Add a row to the table below (date, semver, versionCode, versionName, track, notes); commit.

## Release history

| Date | semver (package.json) | versionCode | versionName | Track | Notes |
|---|---|---|---|---|---|
| 2026-09-05 | 0.1.0 *(not bumped at the time)* | 1 | 1.0.0.0 | Internal testing | First Play Store upload (M14) |
| 2026-09-05 | 1.2.0 | 2 | 1.2.0.0 | Internal testing | Swipe-to-paginate month on the dashboard overview; first release to follow this doc. Hit the wrong-keystore mistake step 7 now guards against — first attempt was rejected by Play Console, caught and fixed before a second upload. |
