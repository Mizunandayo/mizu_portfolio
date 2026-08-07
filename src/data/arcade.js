import { db, configured } from './supabase.js'
import { visitorKey } from './likes.js'

/* ══════════════════════════════════════════════════
   遊技場 — the four cabinets and their board.

   Everything a game needs to be listed, played and
   scored is declared here, so adding a fourth is a
   data change plus one component rather than an edit
   in five files.

   `dir` is which way the board sorts. The server has
   the same knowledge in arcade_board(), and the server
   is the authority — this copy only decides how the
   number is drawn before it has been submitted.

   `lo`/`hi` mirror arcade_limits() in arcade.sql, and
   both are read off what the games can actually emit
   rather than picked. Repeated on purpose: the client
   uses them to refuse to send a nonsense run, the server
   uses them to refuse to believe one. The server is the
   authority — editing this file only changes the error
   message a cheat gets.
   ══════════════════════════════════════════════════ */

export const CABINETS = [
  {
    id: 'boken',
    jp: '冒険',
    name: 'Boken',
    tag: 'Island run',
    how: 'Fruit is life. Space to jump, ↓ to drop off a ledge, Shift to throw. Eggs are a gamble.',
    keys: ['space', '↓', 'shift'],
    dir: 'desc',
    lo: 0,
    hi: 20000, // twenty minutes unbroken at 16.3 m/s
    unit: 'm',
  },
  {
    id: 'hebi',
    jp: '蛇',
    name: 'Snake',
    tag: 'Snake',
    how: 'Eat, grow, and do not bite yourself.',
    keys: ['←', '↑', '↓', '→'],
    dir: 'desc',
    lo: 0,
    hi: 7300, // a perfect 308-cell board is 7,220
    unit: 'pts',
  },
  {
    id: 'touge',
    jp: '峠',
    name: 'Touge',
    tag: 'Downhill run',
    how: 'Steer and dodge the cones. Double-tap ← or → to dash sideways, hold Shift for nitro.',
    keys: ['←', '→', '←← / →→', 'Shift'],
    dir: 'desc',
    lo: 0,
    hi: 200000, // 620 m/s is the top speed with nitro
    unit: 'm',
  },
  {
    id: 'shooter',
    jp: '迎撃',
    name: 'Intercept',
    tag: 'Hold the line',
    how: 'Move and hold Space to fire. Double-tap ↑ or ↓ to dash, shoot the pods for power.',
    keys: ['↑', '↓', '↑↑ / ↓↓', 'Space'],
    dir: 'desc',
    lo: 0,
    hi: 200000, // 200 pts/s is one perfect kill per spawn
    unit: 'pts',
  },
]

export const cabinet = (id) => CABINETS.find((c) => c.id === id) ?? CABINETS[0]

/* Points read bare, everything else takes its unit as a suffix. This
   used to fall through to a lap-time formatter for any unit it did not
   recognise, so Boken's metres printed as 00:00.036. Unknown units now
   read as themselves instead of as a time. */
export function fmtScore(id, n) {
  if (n == null) return '—'
  const { unit } = cabinet(id)
  return unit === 'pts' ? n.toLocaleString() : `${n.toLocaleString()} ${unit}`
}

/* The same number, split, for places that want the unit set quieter than
   the digits. One source for both so a board row and a game-over card
   can never disagree about what a score reads as. */
export function fmtParts(id, n) {
  if (n == null) return { value: '—', unit: '' }
  const { unit } = cabinet(id)
  return { value: n.toLocaleString(), unit: unit === 'pts' ? '' : unit }
}

export const isBetter = (id, a, b) =>
  b == null ? true : cabinet(id).dir === 'desc' ? a > b : a < b

/* The name the visitor last played under, so they do not retype it for
   every run. Not an identity — the visitor key is what the board keys
   on, and that is equally the browser's to invent. */
const NAME = 'mizu:arcade-name'

export const readName = () => {
  try {
    return localStorage.getItem(NAME) ?? ''
  } catch {
    return ''
  }
}

export const writeName = (v) => {
  try {
    localStorage.setItem(NAME, v)
  } catch {
    /* private mode */
  }
}

/* Wipes every score this browser owns, across all four games. Called on
   a name change: a name on the board is meant to be the name that
   earned the run, so a new name starts from nothing. The client warns
   before this is reached. */
export async function forget() {
  if (!configured) return 0
  const n = await db.rpc('arcade_forget', { p_key: visitorKey() })
  return typeof n === 'number' ? n : 0
}

/* Ten rows, plus this visitor's own row whether or not it made the cut.
   The key goes up so the server can flag which row is theirs; it never
   comes back down, for anyone. */
export async function board(game, limit = 10) {
  if (!configured) return []
  const rows = await db.rpc('arcade_board', {
    p_game: game, p_limit: limit, p_key: visitorKey(),
  })
  return Array.isArray(rows) ? rows : []
}

/* Opened when a game actually starts. The token it returns is what the
   server demands at submit time, and it is what makes the clock the
   score is checked against the server's rather than the browser's. */
export async function beginRun(game) {
  if (!configured) return null
  const id = await db.rpc('arcade_begin', { p_game: game, p_key: visitorKey() })
  return typeof id === 'string' ? id : null
}

export async function submit(game, name, score, run) {
  const c = cabinet(game)
  /* Refused here as well as on the server. Not for safety — the server
     is what makes it safe — but so an obviously broken run reports a
     clear message instead of a round trip and a raised exception. */
  if (!Number.isFinite(score) || score < c.lo || score > c.hi) {
    throw new Error('That run did not register.')
  }
  if (!run) throw new Error('That run was not started properly.')

  const rows = await db.rpc('arcade_submit', {
    p_game: game,
    p_name: name,
    p_score: Math.round(score),
    p_key: visitorKey(),
    p_run: run,
  })
  return Array.isArray(rows) ? rows : []
}
