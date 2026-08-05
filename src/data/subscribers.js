import { db, callFunction, upload, publicUrl, removeObjects } from './supabase.js'

/* Its own bucket, not a folder inside tickets. Those are anonymous
   visitor uploads gated on a claimed row; these are admin-authored email
   assets gated on being the admin. Same store, opposite rules. */
const BANNERS = 'banners'
import { EMAIL_RE } from './tickets.js'

/* Write-only from the page. There is no public read because anon holds
   no select grant on the table, so an address can be added and nothing
   read back. Everything below the first function needs an admin session
   and is refused by RLS without one. */
export async function subscribe(email, source = 'band') {
  const clean = String(email ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(clean) || clean.length > 254) {
    throw new Error('That address does not look right.')
  }
  await db.insert('subscribers', { email: clean, source })
}

const COLS = 'id,email,confirmed_at,unsubscribed_at,source,created_at'

export async function listSubscribers(limit = 500) {
  return db.select(
    `subscribers?select=${COLS}&order=created_at.desc&limit=${limit}`
  )
}

export async function setUnsubscribed(id, off) {
  await db.patch(`subscribers?id=eq.${id}`, {
    unsubscribed_at: off ? new Date().toISOString() : null,
  })
}

export async function removeSubscriber(id) {
  await db.remove(`subscribers?id=eq.${id}`)
}

/* The send happens in an Edge Function, not here. The browser never sees
   the list it is mailing: it hands over ids at most, and the function
   resolves them to addresses after checking the caller is an admin.

   `ids` null means every confirmed subscriber. `test` mails the signed-in
   admin alone and touches nobody else. */
export function sendUpdate({ subject, heading, body, ctaLabel, ctaPath, mode, banner, ids, test }) {
  return callFunction('send-update', {
    subject, heading, body, ctaLabel, ctaPath, mode, banner,
    ids: ids ?? null,
    test: Boolean(test),
  })
}

const SENT_COLS =
  'id,subject,heading,body,cta_label,cta_path,mode,banner,recipients,failed,sent_count,is_test,created_at'

export async function listSent(limit = 100) {
  return db.select(
    `sent_emails?select=${SENT_COLS}&order=created_at.desc&limit=${limit}`
  )
}

/* Deferred until a send actually happens, so a draft that is abandoned
   or re-cropped five times leaves nothing in the bucket. */
export async function uploadBanner(blob) {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`
  await upload(BANNERS, key, blob)
  return publicUrl(BANNERS, key)
}

const MARK = `/storage/v1/object/public/${BANNERS}/`

/* Only files this panel put there. A pasted URL or the bundled default
   is not ours to delete. */
function ownPath(url) {
  const i = String(url ?? '').indexOf(MARK)
  return i === -1 ? null : String(url).slice(i + MARK.length)
}

/* Objects before the row, and only when nothing else still points at
   them: two sends of the same crop share one file, and removing one
   would blank the other's banner. */
export async function destroySent(row, all) {
  const path = ownPath(row.banner)
  const shared =
    path && (all ?? []).some((r) => r.id !== row.id && ownPath(r.banner) === path)

  if (path && !shared) await removeObjects(BANNERS, [path])
  await db.remove(`sent_emails?id=eq.${row.id}`)
}

/* Where a broadcast can point. Hashes match the section ids on the home
   page, so a link lands on the thing the email is about. */
export const TARGETS = [
  ['#work', 'Projects', 'See the project'],
  ['#hackathons', 'Hackathons', 'See the hackathon'],
  ['#certifications', 'Certifications', 'See the certification'],
  ['#experience', 'Experience', 'See what changed'],
  ['#stack', 'Stack', 'See the stack'],
  ['#about', 'About', 'Read more'],
  ['#gallery', 'Ticket gallery', 'See the gallery'],
  ['#contact', 'Contact', 'Get in touch'],
  ['', 'Home page', 'Visit the portfolio'],
]
