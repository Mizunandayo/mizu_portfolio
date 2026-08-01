# Project media

Drop real screenshots here and they replace the placeholders automatically —
no code change needed.

## How it works

Each project in `src/data/projects.js` declares its media:

```js
media: [
  { src: 'app.png', cap: 'Agent run view', ratio: '16/9' },
  { yt:  'ndJ8cZIg4cM', cap: 'Video presentation' },
]
```

`ImagePlaceholder` requests `/work/<slug>/<src>`. If the file is missing the
request fails and a labelled placeholder shell renders in its place. Add the
file and the real image appears on next load.

`{ yt: '<id>' }` entries need no local file — they pull the thumbnail from
YouTube and link to the video.

## Expected files

★ marks the project's **first** image, which is also its work-grid card
thumbnail — the one a visitor sees before anything else.

| Folder | 16:9 | 4:3 |
|---|---|---|
| `mitsu/` | ★ `walkthrough.png` | `gestures.png` `multimonitor.png` |
| `minari/` | ★ `app.png` | `reasoning.png` `mr.png` |
| `misaki/` | ★ `app.png` | `riskmap.png` `report.png` |
| `mirai/` | ★ `app.png` | `sim.png` `export.png` |
| `miwa/` | ★ `overlay.png` | `walkthrough.png` `replies.png` |
| `bacsal/` | ★ `home.png` `admin.png` | `contact.png` `team.png` |
| `galactic-conquest/` | ★ `dashboard.png` | `troops.png` `award.png` |
| `hirna/` | ★ `app.png` | `heatmap.png` `award.png` |
| `eye2wear/` | ★ `app.png` `dashboard.png` | `appointment.png` `team.png` |

**29 images total** — 11 at 16:9, 18 at 4:3. The 4 YouTube entries in
`projects.js` need no local file; they pull their thumbnail from YouTube.

## Sizing

| Ratio | Minimum | Used for |
|---|---|---|
| **16:9** | 1600 × 900 | Card thumbnails, wide screenshots |
| **4:3** | 1200 × 900 | Detail shots, award photos |

- Keep each file under ~400 KB — they are served as-is, unoptimised.
- Images are `object-fit: cover`, so anything off-ratio is cropped from
  the centre. Keep the subject away from the edges.
- The ratio for any file is set by its `ratio` field in
  `src/data/projects.js` — change it there if a screenshot suits a
  different shape.
