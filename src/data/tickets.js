import { db, publicUrl, upload, removeObjects } from './supabase.js'

export const BUCKET = 'tickets'

/* Named explicitly: anon holds column grants, so select=* fails. */
const COLS = 'id,name,design,message,thumb_path,plate_path,approved,created_at'
/* notify_email is not in anon's select grant, so only the panel asks. */
const ADMIN_COLS = `${COLS},notify_email,hidden`

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

function shape(row) {
  return {
    ...row,
    thumb: publicUrl(BUCKET, row.thumb_path),
    plate: row.plate_path ? publicUrl(BUCKET, row.plate_path) : null,
  }
}

const TAB_FILTER = {
  pending: 'approved=eq.false',
  approved: 'approved=eq.true&hidden=eq.false',
  hidden: 'approved=eq.true&hidden=eq.true',
}

/* Pending oldest first, because a queue is worked front to back. The
   other two newest first, because they are shelves. */
export async function listForTab(tab, limit = 60) {
  const order = tab === 'pending' ? 'asc' : 'desc'
  const rows = await db.select(
    `tickets?select=${ADMIN_COLS}&${TAB_FILTER[tab]}&order=created_at.${order}&limit=${limit}`
  )
  return rows.map(shape)
}

export async function listApproved(limit = 24) {
  const rows = await db.select(
    `tickets?select=${COLS}&approved=eq.true&order=created_at.desc&limit=${limit}`
  )
  return rows.map(shape)
}

/* Row first, files after. Paths are generated here, so the row can name
   them before they exist. Two reasons: the rate limit lives on the table,
   so a throttled visitor never reaches the bucket; and a row pointing at
   a missing file is visible in the panel and can be rejected, whereas a
   file with no row is invisible and stays forever. */
export async function submit({ thumb, plate, name, design, message, email }) {
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const ext = thumb.type === 'image/webp' ? 'webp' : 'jpg'
  const thumb_path = `${key}-t.${ext}`
  const plate_path = plate ? `${key}-p.${ext}` : null

  await db.insert('tickets', {
    name,
    design,
    message: message || null,
    thumb_path,
    plate_path,
    notify_email: email && EMAIL_RE.test(email) ? email : null,
  })

  await upload(BUCKET, thumb_path, thumb)
  if (plate) await upload(BUCKET, plate_path, plate)
}

export async function approve(id) {
  await db.patch(`tickets?id=eq.${id}`, { approved: true })
}

/* Objects before the row. A row pointing at missing files is visible in
   the panel and fixable; an orphaned object is invisible and permanent. */
export async function destroy(t) {
  await removeObjects(BUCKET, [t.thumb_path, t.plate_path].filter(Boolean))
  await db.remove(`tickets?id=eq.${t.id}`)
}

/* Off the gallery without destroying anything. */
export async function setHidden(id, hidden) {
  await db.patch(`tickets?id=eq.${id}`, { hidden })
}
