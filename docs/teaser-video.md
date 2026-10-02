# Teaser video: script and shot list

A ~40 second silent loop for the landing page hero and the GitHub README. Silent on purpose: it autoplays muted on the web, and captions carry the message. Voice: calm, direct, specific (see the Maxtasy design system's content rules): sentence case, no exclamation marks, no emoji.

## Format

| Output | Spec | Use |
|---|---|---|
| `teaser.mp4` | H.264, 390x844 portrait, 30 fps, no audio | landing page `<video autoplay muted loop playsinline>` |
| `teaser.webm` | VP9, same framing | landing page fallback source |
| `teaser.gif` | 360 px wide, 10 fps, under 10 MB | GitHub README (GitHub doesn't autoplay mp4 in markdown) |

Portrait phone framing because the app is mobile-first and it is what testers see on Android. Recorded against the local dev server with the demo account (`npm run db:seed-demo`), dark theme except for the theme shot.

## Script

The video starts already signed in (the recorder logs in off camera and keeps only the session) on a lived-in demo account: nine months of history, so the year view has real data.

| # | Time | Screen | Action | Caption (sentence case) |
|---|---|---|---|---|
| 1 | 0:00-0:04 | Overview, current month | Static; month summary and a full transaction list are visible. | See where your money goes. |
| 2 | 0:04-0:11 | Categories | Tap the plus button, type `Coffee`, save; the new category appears in the list. | Create your own categories. |
| 3 | 0:11-0:18 | Overview | Add an expense: `4.80`, category Coffee, description `Flat white`. The month's expenses update. | Log an expense in seconds. |
| 4 | 0:18-0:25 | Overview | Add an income: switch to Income, `450`, category Freelance, description `Website project`. | Track income too. |
| 5 | 0:25-0:38 | Insights | Month breakdown by category, then the Year tab, then the Income tab for the year. | Break any month down by category. / Or see the whole year. / Compare it with your income. |
| 6 | 0:38-0:41 | End card | Logo mark and app name on a flat background. | Free. No ads. |

Notes for the edit:
- Captions: lower third, Schibsted Grotesk semibold, one line, 0.4 s fade. Flat solid caption background, no gradients.
- Cuts are hard cuts; no transitions, no zoom effects (matches the system's "no bounce, no spring" motion rule).
- End card uses `src/app/icon.svg` at 96 px and the name set in Schibsted Grotesk semibold, tracking -0.02em.
- Keep the loop point clean: shot 1 and the end card both sit on the dark background.

## Producing it

The finished files are in [`docs/media/`](media/): `teaser.mp4`, `teaser.webm`, `teaser.gif` (mp4 about 0.85 MB, webm 0.6 MB, gif 3 MB). Captions and the end card are drawn into the footage by the recorder, so there is no separate edit step.

To re-record after a UI change, follow the header of `scripts/record-teaser.mjs` (it drives the local app at phone size with Playwright, using the demo account), then convert the raw clip:

```bash
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=30" -c:v libx264 -pix_fmt yuv420p -crf 20 -an -movflags +faststart docs/media/teaser.mp4
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -an docs/media/teaser.webm
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=10,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=80[p];[b][p]paletteuse=dither=bayer:bayer_scale=5" docs/media/teaser.gif
```

Known gaps against the plan above: captions use the app's own font (Geist) rather than Schibsted Grotesk, and the overview list shows transactions dated up to the 25th because the demo seed spreads the current month's data across the whole month. Re-seed (`npm run db:seed-demo`) before every take, since each run creates a category, an expense and an income.
