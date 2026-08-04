/* Supabase over plain fetch. Four endpoints did not justify a 40KB SDK
   against a dependency list held at three. */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(URL_BASE && ANON)

const SESSION = 'mizu:sb-session'

export function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSession(s) {
  try {
    if (s) window.localStorage.setItem(SESSION, JSON.stringify(s))
    else window.localStorage.removeItem(SESSION)
  } catch {}
}

async function authPost(grant, body) {
  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await r.json().catch(() => null)
  if (!r.ok) throw new Error(json?.error_description || json?.msg || 'Sign in failed')
  return json
}

export async function signIn(email, password) {
  const s = await authPost('password', { email, password })
  writeSession(s)
  return s
}

export function signOut() {
  writeSession(null)
}

async function refresh() {
  const s = readSession()
  if (!s?.refresh_token) return null
  try {
    const next = await authPost('refresh_token', { refresh_token: s.refresh_token })
    writeSession(next)
    return next
  } catch {
    writeSession(null)
    return null
  }
}

/* `retry` guards the single refresh attempt so an expired session
   cannot recurse. */
async function rest(path, init = {}, retry = true) {
  const s = readSession()
  const headers = {
    apikey: ANON,
    'Content-Type': 'application/json',
    ...init.headers,
  }
  /* Only when signed in. apikey alone is enough for anon, and the newer
     publishable keys are not JWTs, so sending one as a Bearer fails. */
  if (s?.access_token) headers.Authorization = `Bearer ${s.access_token}`

  const r = await fetch(`${URL_BASE}/rest/v1/${path}`, { ...init, headers })

  if (r.status === 401 && retry && s) {
    const next = await refresh()
    if (next) return rest(path, init, false)
  }

  if (!r.ok) {
    const err = await r.json().catch(() => null)
    throw new Error(err?.message || `Request failed (${r.status})`)
  }

  /* A successful insert without return=representation answers 201 with
     an empty body, and r.json() throws on that. */
  const text = await r.text()
  return text ? JSON.parse(text) : null
}

export const db = {
  select: (path) => rest(path),

  /* No return=representation. Reading the row back runs the SELECT
     policy, which requires approved = true, so asking for it makes a
     valid insert fail as an RLS violation. */
  insert: (path, body) =>
    rest(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: (path, body) =>
    rest(path, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(body),
    }),
  remove: (path) => rest(path, { method: 'DELETE' }),
}

/* Storage rejects a request with no Authorization even for anon, unlike
   PostgREST which is happy with apikey alone. */
function storageHeaders(extra) {
  const s = readSession()
  return {
    apikey: ANON,
    Authorization: `Bearer ${s?.access_token || ANON}`,
    ...extra,
  }
}

export async function upload(bucket, path, blob) {
  const r = await fetch(`${URL_BASE}/storage/v1/object/${bucket}/${path}`, {
    method: 'POST',
    headers: storageHeaders({
      'Content-Type': blob.type || 'application/octet-stream',
    }),
    body: blob,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => null)
    throw new Error(err?.message || `Upload failed (${r.status})`)
  }
  return path
}

export async function removeObjects(bucket, paths) {
  if (!paths.length) return
  const r = await fetch(`${URL_BASE}/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    headers: storageHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ prefixes: paths }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => null)
    throw new Error(err?.message || `Delete failed (${r.status})`)
  }
}

export const publicUrl = (bucket, path) =>
  `${URL_BASE}/storage/v1/object/public/${bucket}/${path}`
