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

| Folder | Files |
|---|---|
| `mitsu/` | `walkthrough.png` `gestures.png` `multimonitor.png` |
| `minari/` | `app.png` `reasoning.png` `mr.png` |
| `misaki/` | `app.png` `riskmap.png` `report.png` |
| `mirai/` | `app.png` `sim.png` `export.png` |
| `miwa/` | `overlay.png` `walkthrough.png` `replies.png` |
| `bacsal/` | `home.png` `contact.png` `team.png` `admin.png` |
| `galactic-conquest/` | `dashboard.png` `troops.png` `award.png` |
| `hirna/` | `app.png` `heatmap.png` `award.png` |
| `eye2wear/` | `app.png` `appointment.png` `team.png` `dashboard.png` |

The first file listed for each project is also its work-grid card image.

## Sizing

- `16/9` entries: 1600×900 or larger
- `4/3` entries: 1200×900 or larger
- Keep each file under ~400 KB — they are served as-is, unoptimised
