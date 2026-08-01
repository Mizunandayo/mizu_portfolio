# Portrait

One file:

```
public/profile/portrait.png
```

Until it exists a "PORTRAIT" placeholder label renders in its place, so
the layout is already correct.

## Spec

| | |
|---|---|
| Filename | **`portrait.png`** |
| Format | **PNG with transparency** — no backdrop |
| Ratio | 4:5 portrait |
| Minimum | 800 × 1000 |
| Size | under ~500 KB — served unoptimised |

## It sits bare on the page

There is no frame, border, card or stamp around it — the cut-out sits
directly on the `#070707` section band. So:

- **Cut the background out cleanly.** Any leftover halo or white fringe
  will be obvious against near-black. Check the edges at 100% zoom.
- **Rendered `object-fit: contain`**, not `cover` — nothing is cropped.
  An off-ratio image letterboxes inside the 4:5 box, and since the
  surrounding area is transparent that is invisible.
- **Light subject, dark page.** A dark-clothed subject can disappear at
  the edges. A rim light or a lighter top helps it read.
- Rendered up to **460px wide**, so 800px+ across covers retina.

## Changing the filename

`PROFILE.portrait` in `src/data/profile.js`:

```js
portrait: { src: 'portrait.png', alt: 'Francis Daniel Genese' },
```

`alt` is the accessible description — keep it as the name, not
"photo of…", since screen readers already announce it as an image.
