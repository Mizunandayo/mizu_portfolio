# Organisation logos

Two files, for the Experience & Education track:

```
public/orgs/bpsu.png     Bataan Peninsula State University
public/orgs/bacsal.png   Bacsal Business Consultancy
```

Until they exist, a labelled placeholder renders in each slot.

## Spec

| | |
|---|---|
| Format | **PNG with transparency** — no backdrop |
| Ratio | **1:1 square** |
| Minimum | 256 × 256 |
| Size | under ~100 KB each |

## They sit bare

No frame, card or plate — the logo sits directly on the `#070707`
section band, same treatment as the About portrait. So:

- **Cut the background out.** A white square will be obvious against
  near-black.
- **Rendered `object-fit: contain`**, so nothing is cropped. A
  non-square logo letterboxes inside the box, which is invisible
  against a transparent surround.
- **Dark logos disappear.** Most university and company marks are dark
  navy or black. If yours is, use a **white or light monochrome
  version** — most brand kits ship one for dark backgrounds. Otherwise
  it will read as an empty space.
- Rendered at **64px** (48px on mobile), so 256px covers retina.

## Adding another entry

Add an object to `TRACK` in `src/data/experience.js` with `start`/`end`
as `YYYY-MM` and a `logo` filename, then drop the file here. The axis
range, year ticks, bar positions and month counts are all derived — the
axis re-scales itself.
