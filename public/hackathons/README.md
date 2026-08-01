# Hackathon media

Drop photos here and they replace the placeholders automatically —
no code change needed.

## How it works

Each entry in `src/data/hackathons.js` declares an `id` (the folder name)
and a `media` array:

```js
{
  id: 'raite-2025',
  media: [
    { src: 'award.png',  cap: 'BPSU — 2nd Runner-Up' },  // ← lead image
    { src: 'plaque.png', cap: 'Plaque' },
    { src: 'team.png',   cap: 'Team' },
  ],
}
```

`media[0]` is the **lead image** — the large one beside the headline.
Everything after it renders in the **gallery strip** below the entry
text, with its caption underneath.

## Expected files

| Folder | Lead (16:9) | Strip (4:3) |
|---|---|---|
| `openai-build-week/` | `walkthrough.png` | `gestures.png` |
| `google-cloud-rapid-agent/` | `app.png` | `submission.png` |
| `transforming-enterprise-ai/` | `certificate.png` | — |
| `web-data-unlocked/` | `certificate.png` | — |
| `amd-developer/` | `certificate.png` | — |
| `hackada-2025/` | `certificate.png` | — |
| `raite-2025/` 🥉 | `award.png` | `plaque.png` `team.png` |
| `byteforward-final-pitch/` | `pitch.png` | `certificate.png` |
| `byteforward-2025/` 🥈 | `award.png` | `certificate.png` `team.png` |

The two 🥈🥉 entries render as **featured** — wider lead image, larger
headline, crosshair frame — so their photos carry the most weight. Worth
using the best shots there.

## Sizing

| Slot | Ratio | Minimum |
|---|---|---|
| Lead | **16:9** | 1200 × 675 |
| Strip thumbnail | **4:3** | 600 × 450 |

- Images are `object-fit: cover`, so off-ratio files crop from the
  centre. Certificates are usually landscape A4 (≈ 1.41:1) and will lose
  a little top and bottom in a 16:9 lead slot — crop them yourself first
  if the border matters.
- Keep each file under ~300 KB; they are served unoptimised.

## Adding more photos

Append to the `media` array — the strip is an auto-fill grid, so it
absorbs any number without a layout change. Add a new hackathon by
adding an entry with a new `id` and creating the matching folder; the
year bands, record line and ordering are all derived.
