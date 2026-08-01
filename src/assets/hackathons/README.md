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

One rule: **`cover.png` leads, then `01.png`, `02.png`, `03.png` …** in
gallery order. Zero-padded so the folder sorts correctly past nine.

Meaning lives in the caption, not the filename — so adding a photo never
means renaming an existing one.

| Folder | Files | Status |
|---|---|---|
| `openai-build-week/` | `cover.png` `01.png` | ✅ cover |
| `google-cloud-rapid-agent/` | `cover.png` `01.png` | ✅ cover |
| `transforming-enterprise-ai/` | `cover.png` | ✅ done |
| `web-data-unlocked/` | `cover.png` | ✅ done |
| `amd-developer/` | `cover.png` | ✅ done |
| `hackada-2025/` | `cover.png` | ✅ done |
| `raite-2025/` 🥉 | `cover.png` `01.png` `02.png` | ✅ cover |
| `byteforward-final-pitch/` | `cover.png` `01.png` | ✅ cover |
| `byteforward-2025/` 🥈 | `cover.png` `01.png` `02.png` | ✅ cover |

All 9 covers are in. **7 secondary images outstanding.**

## Adding more photos

Two steps, no renaming:

1. Drop the next number into the folder — `02.png`, `03.png`, …
2. Append a row to that entry's `media` array in
   `src/data/hackathons.js`:

```js
media: [
  { src: 'cover.png', cap: 'BPSU1 — 1st Runner-Up' },
  { src: '01.png',    cap: 'Certificate of Participation' },
  { src: '02.png',    cap: 'BPSU1 team' },
  { src: '03.png',    cap: 'Awarding night' },   // ← new
],
```

The array is the source of truth — the site cannot read a directory, so
a file with no row never appears, and a row with no file shows a
placeholder. Both are safe.

The two 🥈🥉 entries render as **featured** — wider lead image, larger
headline, crosshair frame — so their photos carry the most weight. Worth
using the best shots there.

## Sizing

| Slot | Ratio | Minimum |
|---|---|---|
| Every image | **16:9** | 1600 × 900 |

**PNG or JPG both work.** The data says `.png`, but the loader falls
back through `png → jpg → jpeg → webp → avif`, so `cover.jpg` in the
folder loads fine with no code change.

Matching the extension in `hackathons.js` to what you actually uploaded
avoids one wasted 404 per image — worth doing for photos, since JPG is
the better format for them anyway.

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
