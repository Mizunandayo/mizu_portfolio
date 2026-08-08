import { db, configured } from './supabase.js'
import { LIKES_CHANGED } from '../events.js'

/* ══════════════════════════════════════════════════
   Project likes, with no accounts behind them.

   The visitor key is a convenience, not a control:
   the browser mints it and the browser sends it, so
   anyone who wants a second like can have one. What it
   buys is a working toggle and no accidental
   double-counting. The real limit is the per-IP
   throttle in toggle_like, which is server side and
   cannot be reached around.

   Counts come from project_stats, which is the only
   thing anon may read. Who liked what is not
   selectable by anybody but an admin.
   ══════════════════════════════════════════════════ */

const KEY = 'mizu:like-key'
const MINE = 'mizu:liked'

/* Tickets and hackathons share the projects' table rather than getting
   one each, and one per-IP throttle across all three is the behaviour
   we want anyway — forty likes an hour is forty likes an hour, whatever
   they were spent on. The prefix keeps the three namespaces apart.

   toggle_like does NOT accept an arbitrary slug: it refuses anything it
   cannot find, so each prefix needs a matching allowlist on the server.
   Projects come from project_stats, tickets from an approved row, and
   hackathons from public.hackathons — which is seeded from
   data/hackathons.js in schema.sql and has to gain a row whenever a
   hackathon is added here. */
export const ticketSlug = (id) => `ticket:${id}`
export const hackSlug = (id) => `hack:${id}`

export function visitorKey() {
  try {
    let k = localStorage.getItem(KEY)
    if (!k) {
      k = crypto.randomUUID()
      localStorage.setItem(KEY, k)
    }
    return k
  } catch {
    /* Private mode. A per-session key still toggles correctly for as
       long as the tab lives, which is better than a dead button. */
    return (visitorKey.fallback ??= crypto.randomUUID())
  }
}

/* Mirrored locally so the button knows its own state before the network
   answers. The server is still the authority; this only decides which
   way the heart points on first paint. */
export function readMine() {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE) || '[]'))
  } catch {
    return new Set()
  }
}

function writeMine(set) {
  try {
    localStorage.setItem(MINE, JSON.stringify([...set]))
  } catch { /* private mode */ }
}

export async function listCounts() {
  if (!configured) return {}
  const rows = await db.select('project_stats?select=slug,likes')
  return Object.fromEntries((rows ?? []).map((r) => [r.slug, r.likes]))
}

export async function toggle(slug) {
  const rows = await db.rpc('toggle_like', {
    p_slug: slug,
    p_key: visitorKey(),
  })

  /* PostgREST returns a set-returning function as an array. */
  const out = Array.isArray(rows) ? rows[0] : rows
  if (!out) throw new Error('That did not register. Try again.')

  const mine = readMine()
  out.liked ? mine.add(slug) : mine.delete(slug)
  writeMine(mine)

  window.dispatchEvent(
    new CustomEvent(LIKES_CHANGED, {
      detail: { slug, likes: out.likes, liked: out.liked },
    })
  )

  return { likes: out.likes, liked: out.liked }
}
