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

   `lo`/`hi` mirror the bounds in arcade.sql. Repeated
   on purpose: the client uses them to refuse to submit
   a nonsense run, the server uses them to refuse to
   believe one.
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
    hi: 100000,
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
    hi: 999999,
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
    hi: 100000,
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
    hi: 999999,
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

/* Renames every row this browser owns, across all four games. Called on
   a name change so a player is one name everywhere rather than the old
   one on boards they have not been back to beat. */
export async function rename(name) {
  if (!configured) return 0
  const n = await db.rpc('arcade_rename', { p_name: name, p_key: visitorKey() })
  return typeof n === 'number' ? n : 0
}

export async function board(game, limit = 50) {
  if (!configured) return []
  const rows = await db.rpc('arcade_board', { p_game: game, p_limit: limit })
  return Array.isArray(rows) ? rows : []
}

export async function submit(game, name, score) {
  const c = cabinet(game)
  /* Refused here as well as on the server. Not for safety — the server
     is what makes it safe — but so an obviously broken run reports a
     clear message instead of a round trip and a raised exception. */
  if (!Number.isFinite(score) || score < c.lo || score > c.hi) {
    throw new Error('That run did not register.')
  }

  const rows = await db.rpc('arcade_submit', {
    p_game: game,
    p_name: name,
    p_score: Math.round(score),
    p_key: visitorKey(),
  })
  return Array.isArray(rows) ? rows : []
}
