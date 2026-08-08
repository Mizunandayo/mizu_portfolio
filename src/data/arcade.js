import { db, configured } from './supabase.js'
import { visitorKey } from './likes.js'

/* 遊技場 — the four cabinets and their board. */

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

/* Points read bare, everything else takes its unit as a suffix. */
export function fmtScore(id, n) {
  if (n == null) return '—'
  const { unit } = cabinet(id)
  return unit === 'pts' ? n.toLocaleString() : `${n.toLocaleString()} ${unit}`
}

/* The same number, split, for places that want the unit set quieter than the digits. */
export function fmtParts(id, n) {
  if (n == null) return { value: '—', unit: '' }
  const { unit } = cabinet(id)
  return { value: n.toLocaleString(), unit: unit === 'pts' ? '' : unit }
}

export const isBetter = (id, a, b) =>
  b == null ? true : cabinet(id).dir === 'desc' ? a > b : a < b

/* The name the visitor last played under, so they do not retype it for every run. */
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

/* Wipes every score this browser owns, across all four games. */
export async function forget() {
  if (!configured) return 0
  const n = await db.rpc('arcade_forget', { p_key: visitorKey() })
  return typeof n === 'number' ? n : 0
}

export const NAME_MAX = 15

/* Asked while typing, so the gate can refuse a taken name before the run rather than after it. */
export async function nameTaken(name) {
  if (!configured) return false
  const v = await db.rpc('arcade_name_taken', {
    p_name: name, p_key: visitorKey(),
  })
  return v === true
}

/* Ten rows, plus this visitor's own row whether or not it made the cut. */
export async function board(game, limit = 10) {
  if (!configured) return []
  const rows = await db.rpc('arcade_board', {
    p_game: game, p_limit: limit, p_key: visitorKey(),
  })
  return Array.isArray(rows) ? rows : []
}

/* Opened when a game actually starts. */
export async function beginRun(game) {
  if (!configured) return null
  const id = await db.rpc('arcade_begin', { p_game: game, p_key: visitorKey() })
  return typeof id === 'string' ? id : null
}

export async function submit(game, name, score, run) {
  const c = cabinet(game)
  /* Refused here as well as on the server. */
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
