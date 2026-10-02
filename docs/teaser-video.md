# Teaser video: script and shot list

A ~25 second silent loop for the landing page hero and the GitHub README. Silent on purpose: it autoplays muted on the web, and captions carry the message. Voice: calm, direct, specific (see the Maxtasy design system's content rules): sentence case, no exclamation marks, no emoji.

## Format

| Output | Spec | Use |
|---|---|---|
| `teaser.mp4` | H.264, 390x844 portrait, 30 fps, no audio | landing page `<video autoplay muted loop playsinline>` |
| `teaser.webm` | VP9, same framing | landing page fallback source |
| `teaser.gif` | 390 px wide, 12 fps, under 10 MB | GitHub README (GitHub doesn't autoplay mp4 in markdown) |

Portrait phone framing because the app is mobile-first and it is what testers see on Android. Recorded against the local dev server with the demo account (`npm run db:seed-demo`), dark theme except for the theme shot.

## Script

| # | Time | Screen | Action | Caption (sentence case) |
|---|---|---|---|---|
| 1 | 0:00-0:03 | Overview, current month | Static; the month summary and list are visible. | See where your money goes. |
| 2 | 0:03-0:10 | Add transaction dialog | Tap the plus button. Type `12.50`, pick Food, description `Lunch`, save. The new row appears and the month totals change. | Log an expense in seconds. |
| 3 | 0:10-0:14 | Recurring | Open Recurring; the rent rule is listed. | Set rent and salary once. |
| 4 | 0:14-0:19 | Insights | Open Insights; the category bars are visible for the month. | Know what each category costs. |
| 5 | 0:19-0:23 | Settings | Change Appearance to Light; the whole UI flips. | Dark, light, or match your system. |
| 6 | 0:23-0:26 | End card | Logo mark and app name on a flat background. | Free. No ads. |

Notes for the edit:
- Captions: lower third, Schibsted Grotesk semibold, one line, 0.4 s fade. Flat solid caption background, no gradients.
- Cuts are hard cuts; no transitions, no zoom effects (matches the system's "no bounce, no spring" motion rule).
- End card uses `src/app/icon.svg` at 96 px and the name set in Schibsted Grotesk semibold, tracking -0.02em.
- Keep the loop point clean: shot 1 and the end card both sit on the dark background.

## Producing it

The finished files are in [`docs/media/`](media/): `teaser.mp4`, `teaser.webm`, `teaser.gif` (about 1.2 MB for the mp4 and webm, 2 MB for the gif). Captions and the end card are drawn into the footage by the recorder, so there is no separate edit step.

To re-record after a UI change, follow the header of `scripts/record-teaser.mjs` (it drives the local app at phone size with Playwright, using the demo account), then convert the raw clip:

```bash
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=30" -c:v libx264 -pix_fmt yuv420p -crf 20 -an -movflags +faststart docs/media/teaser.mp4
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=30" -c:v libvpx-vp9 -b:v 0 -crf 34 -an docs/media/teaser.webm
ffmpeg -i docs/media/teaser-raw.webm -vf "fps=12,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" docs/media/teaser.gif
```

Known gaps against the plan above: captions use the app's own font (Geist) rather than Schibsted Grotesk, and the add-expense shot appears over a list dated up to the 25th because the demo seed spreads data across the whole month.
