/* Every entry here is a hackathon — there are no non-hackathon honors,
   which is why this is not called "awards". Only two carry a podium
   placement; the rest are entries and completions, and labelling those
   as awards would overstate them.

   `placement` marks a podium: those render as featured entries with a
   larger lead image and crosshair register marks. `rank` is the
   finishing position, lower is better, used to break same-month ties.

   `id` is the media folder under src/assets/hackathons/. Images are
   discovered from that folder at build time — see hackathonMedia.js —
   so there is no media list to maintain. Drop a file in and it shows;
   remove it and it stops.

   Naming: `cover` leads, then `01`, `02`, `03` … Any of png/jpg/jpeg/
   webp/avif. `captions` is optional alt text keyed by filename stem;
   anything unnamed falls back to a positional label. */

export const HACKATHONS = [
  {
    id:        'openai-build-week',
    title:     'OpenAI Build Week Hackathon',
    issuer:    'OpenAI · DevPost',
    date:      'Jul 2026',
    sort:      '2026-07',
    placement: null,
    note:      'Apps for Your Life track — computer vision, built solo in 8 days.',
    project:   'Mitsu 見つ — Touchless Window Control for Windows',
    slug:      'mitsu',
    captions: {
      'cover': 'Mitsu walkthrough',
      '01':    'Gesture control',
    },
  },
  {
    id:        'google-cloud-rapid-agent',
    title:     'Google Cloud Rapid Agent Hackathon',
    issuer:    'Google Cloud · DevPost',
    date:      'May – Jun 2026',
    sort:      '2026-06',
    placement: null,
    note:      'GitLab track — autonomous flaky-test repair, built solo.',
    project:   'Minari 実成 — Autonomous Flaky-Test Resolution',
    slug:      'minari',
    captions: {
      'cover': 'Minari web app',
      '01':    'DevPost submission',
    },
  },
  {
    id:        'byteforward-2025',
    title:     'Byteforward Hackathon',
    issuer:    'Converge & Rev21 Labs Inc.',
    date:      'Jun 2025',
    sort:      '2025-06',
    placement: '🥈 1st Runner-Up',
    rank:      2,
    note:      'First hackathon entered — placed on the first attempt.',
    project:   'HirNa! — Smart Talent Sourcing Platform',
    slug:      'hirna',
    captions: {
      'cover': 'BPSU1 — 1st Runner-Up',
      '01':    'Certificate of Participation',
      '02':    'BPSU1 team',
    },
  },
  {
    id:        'raite-2025',
    title:     'RAITE 2025 Hackathon Programming Competition',
    issuer:    'Regional Assembly on Information Technology Education',
    date:      'Oct 2025',
    sort:      '2025-10',
    placement: '🥉 2nd Runner-Up',
    rank:      3,
    note:      'National-level programming competition.',
    project:   'Galactic Conquest — Web3 Mining Strategy Game',
    slug:      'galactic-conquest',
    captions: {
      'cover': 'BPSU — 2nd Runner-Up',
      '01':    'Plaque',
      '02':    'Team',
    },
  },
  {
    id:        'transforming-enterprise-ai',
    title:     'Transforming Enterprise Through AI Hackathon',
    issuer:    'lablab.ai',
    date:      'Jun 2026',
    sort:      '2026-06',
    placement: null,
    note:      'Robotics & Simulation track.',
    project:   'Mirai ミライ — AI-Powered Robot Arm Simulator',
    slug:      'mirai',
    captions: {
      'cover': 'Certificate of Completion',
    },
  },
  {
    id:        'web-data-unlocked',
    title:     'Web Data UNLOCKED Hackathon',
    issuer:    'lablab.ai',
    date:      'Jun 2026',
    sort:      '2026-06',
    placement: null,
    note:      'Security & Compliance + AI/ML API track.',
    project:   'Misaki 見先 — AI Legislative Intelligence Platform',
    slug:      'misaki',
    captions: {
      'cover': 'Certificate of Completion',
    },
  },
  {
    id:        'amd-developer',
    title:     'AMD Developer Hackathon',
    issuer:    'lablab.ai',
    date:      'Jun 2026',
    sort:      '2026-06',
    placement: null,
    note:      'AI Agents & Agentic Workflows track, on MI300X.',
    project:   'Miwa 美話 — Real-Time Discord Voice Translation Overlay',
    slug:      'miwa',
    captions: {
      'cover': 'Certificate of Completion',
    },
  },
  {
    id:        'hackada-2025',
    title:     'HacKada — AI in UX for Fintech',
    issuer:    'KadaKareer × Home Credit',
    date:      'Dec 2025',
    sort:      '2025-12',
    placement: null,
    note:      'Qualification round — concept only, not built.',
    /* No project card: this never became a shipped build. */
    project:   'Homie (concept)',
    slug:      null,
    captions: {
      'cover': 'Certificate of Completion',
    },
  },
  {
    id:        'byteforward-final-pitch',
    title:     'Byteforward Hackathon: The Final Pitch',
    issuer:    'Converge & Rev21 Labs Inc.',
    date:      'Oct 2025',
    sort:      '2025-10',
    placement: null,
    note:      'Advanced to the Final Pitch stage.',
    project:   'HirNa! — Smart Talent Sourcing Platform',
    slug:      'hirna',
    captions: {
      'cover': 'Final Pitch',
      '01':    'Certificate of Participation',
    },
  },
]

/* Strictly newest-first; a podium wins any same-month tie. The section
   renders chronologically rather than podium-first — the run itself is
   the point, and the wins carry their own visual weight. */
export const HACKATHONS_ORDERED = [...HACKATHONS].sort((a, b) => {
  const byDate = b.sort.localeCompare(a.sort)
  if (byDate !== 0) return byDate
  if (!!a.placement !== !!b.placement) return a.placement ? -1 : 1
  return (a.rank ?? 9) - (b.rank ?? 9)
})

/* Grouped into year bands, newest year first. */
export const HACKATHON_YEARS = HACKATHONS_ORDERED.reduce((bands, h) => {
  const year = h.sort.slice(0, 4)
  const band = bands.find((b) => b.year === year)
  if (band) band.items.push(h)
  else bands.push({ year, items: [h] })
  return bands
}, [])

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export const monthOf = (sortKey) => MONTH_ABBR[Number(sortKey.slice(5, 7)) - 1]

/* Record line. Every figure is derived — nothing to keep in sync. */
export const HACKATHON_RECORD = (() => {
  const keys = HACKATHONS.map((h) => h.sort).sort()
  const [y0, m0] = keys[0].split('-').map(Number)
  const [y1, m1] = keys[keys.length - 1].split('-').map(Number)

  /* Busiest single month — the copy cites it, so derive it rather than
     hard-coding a number that goes stale the next time one is added. */
  const perMonth = keys.reduce((m, k) => ({ ...m, [k]: (m[k] || 0) + 1 }), {})
  const peak = Math.max(...Object.values(perMonth))

  return {
    entered:  HACKATHONS.length,
    podium:   HACKATHONS.filter((h) => h.placement).length,
    /* HirNa! came out of two separate entries — count projects, not rows. */
    projects: new Set(HACKATHONS.filter((h) => h.slug).map((h) => h.slug)).size,
    months:   (y1 - y0) * 12 + (m1 - m0) + 1,
    peakMonth: peak,
  }
})()

export const HACKATHON_COUNT = HACKATHONS.length
export const PODIUM_COUNT = HACKATHON_RECORD.podium
