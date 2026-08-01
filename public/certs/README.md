# Certification badges

Drop badge images here and they replace the placeholders automatically —
no code change needed.

## Expected files

Filenames come from the `badge` field in `src/data/certifications.js`.

| File | Certification |
|---|---|
| `it-specialist-software-development.png` | IT Specialist — Software Development |
| `it-specialist-network-security.png` | IT Specialist — Network Security |
| `it-specialist-device-configuration.png` | IT Specialist — Device Configuration and Management |
| `it-specialist-cybersecurity.png` | IT Specialist — Cybersecurity |
| `ic3-digital-literacy.png` | IC3 Digital Literacy GS6 Level 1 |
| `mos-associate.png` | Office Specialist: Associate |
| `mos-excel.png` | Office Specialist: Excel Associate |
| `mos-word.png` | Office Specialist: Word Associate |
| `mos-powerpoint.png` | Office Specialist: PowerPoint Associate |
| `cisco-cyber-threat-management.png` | Cyber Threat Management |
| `pmi-project-management-ready.png` | PMI Project Management Ready™ |

## Sizing

- **Square**, 400×400 to 600×600. The card frame is `1:1`.
- **PNG with transparency** is ideal — badges sit on a dark frame, so a
  white rectangular background will show as a bright block.
- Rendered with `object-fit: contain`, so nothing is cropped. A
  non-square image letterboxes rather than clipping.
- Keep each under ~150 KB; they are served unoptimised.

## Where to get them

Credly (Microsoft, Cisco, PMI) and Certiport both offer a badge image
download from the credential page. The credential IDs in
`src/data/certifications.js` match the ones on those pages.

## Adding a new certification

Add an entry to `CERTIFICATIONS` in `src/data/certifications.js` with a
`sort` key (`YYYY-MM`) and a `badge` filename, then drop the file here.
Ordering is derived from `sort` — newest first — so nothing else needs
touching.
