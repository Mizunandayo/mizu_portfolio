# Project gallery images

Drop screenshots here and they appear in that project's dialog. Nothing
to edit in code — the folders are read at build time.

```
src/assets/work/<slug>/p1.png
src/assets/work/<slug>/p2.png
…
src/assets/work/<slug>/p10.png
```

## Rules

| | |
|---|---|
| **Name** | `p1` … `p10`, nothing else. A file named anything other than `p<number>` is ignored. |
| **How many** | Up to **10**. Five files show five panels; ten show ten. `p11` and beyond are skipped rather than making the dialog scroll forever. |
| **Gaps are fine** | `p1`, `p2`, `p7` renders three panels in that order. The numbers set the order, not the count. |
| **Formats** | `.png` `.jpg` `.jpeg` `.webp` `.avif` — upper or lower case. |
| **Shape** | Panels render at 16:9 and crop to fill, so screenshots around 1600×900 look best. Anything much taller loses its top and bottom. |

## The nine folders

```
mitsu   minari   misaki   mirai   miwa
bacsal  galactic-conquest  hirna  eye2wear
```

The folder name must match the project's `slug` in
[`src/data/projects.js`](../../data/projects.js) exactly.

## Why here and not `public/`

`public/` is copied into the build verbatim and never enters the module
graph, so it cannot be enumerated — a browser can't list a directory,
and a hand-written array in `projects.js` drifts the moment a file is
added. Under `src/assets/` Vite resolves the folder at build time, so
what's on disk *is* what renders. The files also get content-hashed for
caching, which `public/` doesn't do.

This is the same mechanism the hackathon galleries already use
(`src/assets/hackathons/<id>/`).

## Until you add files

A project with an empty folder keeps rendering whatever its `media`
array in `projects.js` declares, so nothing goes blank while the
screenshots are still being gathered. The moment `p1` lands, the folder
takes over.

Videos stay in `projects.js` — a YouTube id isn't a file and can't be
discovered. Declared videos are appended after the discovered stills.

## Captions

Optional. Add a `shotCaptions` map to the project in `projects.js`:

```js
shotCaptions: { p1: 'Dashboard', p3: 'Offline sync' },
```

Anything unnamed falls back to `Screen 1`, `Screen 2`, …
