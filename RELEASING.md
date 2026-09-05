# Releasing

How to ship a new version of this app, including to the Android app on Google Play (published via PWABuilder as a TWA — see CLAUDE.md's PWA section for the packaging background).

## What "version" means here

`package.json`'s `version` (semver, e.g. `1.2.0`) is the source of truth. It's shown in-app on the Settings page footer, imported directly from `package.json` — there's no second place to edit it.

Play Console additionally needs its own:

- **`versionCode`** — a plain integer that must strictly increase on every upload. Unrelated to semver; tracked only in this file's release history table below, since Play Console is the only other place it's visible.
- **`versionName`** — free text shown to users in the Play Store. Convention so far: `"{semver}.0"` (e.g. `"1.2.0.0"`), an artifact of PWABuilder's default format.

## Steps

1. Bump `package.json`'s `version`.
2. Implement/verify the feature itself; commit.
3. Push to `main` (auto-deploys to Vercel — the live web app updates immediately; this alone is enough for anyone not using the Android app).
4. Check the last row of the release history table below for the last `versionCode`; the new one is `+1`.
5. Go to [pwabuilder.com](https://www.pwabuilder.com) → enter the production URL (`https://expense-tracker-rose-ten-25.vercel.app`) → "Package for Stores" → Android → set `versionName` to `"{semver}.0"` and `versionCode` to the incremented value → **upload the existing signing keystore rather than letting it generate a new one** (a new key breaks Play Console's signature match on an update — Play Console will reject the upload).
6. Download the signed `.aab`.
7. Play Console → Production release → upload the `.aab` → release notes → review → roll out.
8. Spot check `public/.well-known/assetlinks.json`'s fingerprint still matches Play Console's **Setup → App integrity → App signing key certificate**. It shouldn't have changed — only touch this file if it actually mismatches.
9. Add a row to the table below (date, semver, versionCode, versionName, notes); commit.

## Release history

| Date | semver (package.json) | versionCode | versionName | Notes |
|---|---|---|---|---|
| 2026-09-05 | 0.1.0 *(not bumped at the time)* | 1 | 1.0.0.0 | First Play Store upload (M14) |
| 2026-09-05 | 1.2.0 | 2 | 1.2.0.0 | Swipe-to-paginate month on the dashboard overview; first release to follow this doc |
