import { ICONS } from '../../data/icons.js'

/* ══════════════════════════════════════════════════
   Technology icon.

   Brand marks and their colours come from
   src/data/icons.js (generated from simple-icons — run
   `npm run icons`). Colours are the real brand hex,
   lightness-corrected at build time so nothing
   disappears against #050505; see scripts/gen-icons.mjs.

   Anything without a brand mark — vLLM, tree-sitter,
   OpenAI, CSP/HSTS, Server-Sent Events — gets a stroked
   glyph chosen from its stack category, so no row ever
   renders an empty icon slot. Those stay neutral: they
   are categories, not brands, and inventing a colour
   for them would imply one.
   ══════════════════════════════════════════════════ */

/* Stroked fallbacks. Deliberately lighter than the solid brand
   silhouettes — they read as "category", not as a logo. */
const GLYPHS = {
  code: (
    <>
      <path d="M9.4 7.8 5.2 12l4.2 4.2" />
      <path d="M14.6 7.8 18.8 12l-4.2 4.2" />
      <path d="M13.4 5.4 10.6 18.6" />
    </>
  ),
  model: (
    <>
      <circle cx="5.5" cy="6.5" r="2" />
      <circle cx="5.5" cy="17.5" r="2" />
      <circle cx="18.5" cy="12" r="2" />
      <path d="M7.4 7.5 16.6 11.2" />
      <path d="M7.4 16.5 16.6 12.8" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.2 2.8 8 12 12.8 21.2 8 12 3.2Z" />
      <path d="M2.8 12.4 12 17.2l9.2-4.8" />
      <path d="M2.8 16.6 12 21.4l9.2-4.8" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4.5" width="18" height="6" rx="1.6" />
      <rect x="3" y="13.5" width="18" height="6" rx="1.6" />
      <path d="M6.9 7.5h.01" strokeWidth="2.4" />
      <path d="M6.9 16.5h.01" strokeWidth="2.4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5.8" rx="7.8" ry="3" />
      <path d="M4.2 5.8v12.4c0 1.66 3.5 3 7.8 3s7.8-1.34 7.8-3V5.8" />
      <path d="M4.2 12c0 1.66 3.5 3 7.8 3s7.8-1.34 7.8-3" />
    </>
  ),
  vision: (
    <>
      <path d="M2.4 12S6 5.6 12 5.6 21.6 12 21.6 12 18 18.4 12 18.4 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.6 5.9v5.4c0 4.9 3.2 8.7 7.4 10.4 4.2-1.7 7.4-5.5 7.4-10.4V5.9L12 2.8Z" />
      <path d="M9 11.9l2.2 2.2 4.2-4.4" />
    </>
  ),
  terminal: (
    <>
      <rect x="2.6" y="4" width="18.8" height="16" rx="2" />
      <path d="M7 9.6 10 12l-3 2.4" />
      <path d="M12.6 15.2h5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.6 2.7 4 5.9 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.9-4-9s1.4-6.3 4-9Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8.2" cy="8.2" r="4.4" />
      <path d="M11.4 11.4 20.4 20.4" />
      <path d="M16.6 16.6 19 14.2" />
    </>
  ),
  chart: (
    <>
      <path d="M3 20.6h18" />
      <path d="M6.2 20.6v-6.4" />
      <path d="M11.4 20.6V6.4" />
      <path d="M16.6 20.6v-9.6" />
    </>
  ),
  node: (
    <>
      <path d="M12 2.7 20.1 7.35v9.3L12 21.3 3.9 16.65v-9.3L12 2.7Z" />
    </>
  ),
}

/* Category → glyph. First match wins, so the order matters:
   "Backend & Infrastructure" must resolve before "Data & Infrastructure". */
const CATEGORY_RULES = [
  [/language/i,                    'code'],
  [/vision|physics/i,              'vision'],
  [/web data|web3|blockchain/i,    'globe'],
  [/auth|api/i,                    'key'],
  [/visuali[sz]ation/i,            'chart'],
  [/security|quality|testing/i,    'shield'],
  [/tool|version control/i,        'terminal'],
  [/backend/i,                     'server'],
  [/ai |ai&|ai$|sdk|agent|model/i, 'model'],
  [/data|infrastructure|storage/i, 'database'],
  [/frontend|ecosystem|desktop/i,  'layers'],
]

function glyphFor(category = '') {
  for (const [re, key] of CATEGORY_RULES) if (re.test(category)) return key
  return 'node'
}

export default function TechIcon({ name, category, size = 18 }) {
  const brand = ICONS[name]

  if (brand) {
    return (
      <span className="si-icon-mizu is-brand" style={{ color: brand.c }} aria-hidden="true">
        <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" role="presentation">
          <path d={brand.p} />
        </svg>
      </span>
    )
  }

  return (
    <span className="si-icon-mizu is-glyph" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="presentation"
      >
        {GLYPHS[glyphFor(category)]}
      </svg>
    </span>
  )
}
