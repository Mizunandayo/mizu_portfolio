import { TRACKS } from './music.js'

/* ══════════════════════════════════════════════════
   Credits and disclaimer.

   Two jobs, and the order matters. The disclaimer says
   what is claimed and what is not; the list credits
   what can actually be identified.

   Deliberately not the usual "no copyright infringement
   intended" — that phrase carries no legal weight and
   reads as an admission. What does carry weight is
   being specific about the terms of use and leaving an
   obvious route to a takedown request, so a rights
   holder emails rather than filing with the host and
   taking the whole deployment offline.
   ══════════════════════════════════════════════════ */

export const DISCLAIMER = [
  'Third-party artwork, video and music appear on this site for design ' +
    'purposes only. Each remains the property of its original creator or ' +
    'rights holder. No ownership is claimed and no licence is granted or ' +
    'implied — nothing here is offered for reuse or redistribution.',

  'Where a work could be identified it is credited below. Much of it was ' +
    'sourced through Pinterest, which strips original attribution, so some ' +
    'creators remain unknown.',
]

/* The one line that does the practical work: it turns a takedown notice
   to the host — which pulls the site down before anyone is told — into
   an email that can be answered. */
export const TAKEDOWN =
  'If a work here is yours, email me and I will credit it properly or ' +
  'remove it, whichever you prefer.'

/* Music reads from the same array the player does, so a track renamed
   in one place cannot end up miscredited in the other. */
const MUSIC = TRACKS.map((t) => ({ name: t.title, by: t.artist }))

/* Everything the site actually licenses. Worth listing on its own — it
   shows the page is a record rather than an apology. */
const TYPE = [
  { name: 'Poppins', by: 'Indian Type Foundry · SIL Open Font License' },
  { name: 'Outfit', by: 'Smartsheet · SIL Open Font License' },
  { name: 'Shippori Mincho', by: 'FONTDASU · SIL Open Font License' },
  { name: 'Chakra Petch', by: 'Cadson Demak · SIL Open Font License' },
]

/* Fill these in as works are identified — Google Lens, SauceNAO or
   trace.moe will name most anime stills from a single frame. Format:
   { name: 'Series or work', by: '© Studio / Publisher' }
   Optional `href` links the entry to its source.

   Left mostly empty rather than guessed: a wrong attribution is worse
   than an honest gap, and the note below covers the gap.

   The hero clip is the one item with a creator who can be named, so it
   is named. Credit is not permission and does not licence anything —
   what it does is make a creator who finds it far more likely to send a
   message than a takedown notice. If Kioy agrees to the use, change
   `by` to read "used with permission".

   The link is the canonical post URL. The share link TikTok hands you
   carries is_from_webapp, sender_device and web_id — and web_id is the
   copying browser's own device identifier, which has no business in a
   public credits list. */
const ARTWORK = [
  {
    name: 'Hero background clip',
    by: 'Kioy · @kioyuie3 on TikTok',
    href: 'https://www.tiktok.com/@kioyuie3/video/7658900062600269076',
  },
]

export const CREDITS = [
  { group: 'Music', jp: '音楽', items: MUSIC },
  {
    group: 'Artwork & video',
    jp: '画像',
    items: ARTWORK,
    note: 'Additional artwork and video sourced via Pinterest and other aggregators; original creators unidentified.',
  },
  { group: 'Typefaces', jp: '書体', items: TYPE },
]
