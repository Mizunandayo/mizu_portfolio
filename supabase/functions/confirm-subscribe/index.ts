/* The other end of the link in notify-subscribe. Deployed with
   --no-verify-jwt: it is opened from a mail client, which cannot carry a
   Supabase key. The token is the only credential, which is why it is a
   v4 uuid the subscriber never gets to choose.

   It writes and redirects rather than answering with a page. Edge
   Functions serve everything as text/plain with nosniff and a sandbox
   CSP, so a browser is forbidden from rendering markup returned from
   here whatever Content-Type is set. That is deliberate on Supabase's
   side: it stops anyone hosting a convincing page on a supabase.co
   domain. So the page lives on the site and this only decides which
   one. */

const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
const SB_URL = Deno.env.get('SUPABASE_URL')!
/* SUPABASE_SERVICE_ROLE_KEY is injected by the platform, but a project
   on the newer publishable/secret keys may not carry it, in which case
   this is undefined and every request goes out as "Bearer undefined". */
const SB_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''

const BUILD = 'v4 redirect to site'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* 303, not 302: the browser must land on the page with a GET, and a
   303 says so rather than leaving it to the client to decide. */
const to = (state: string) =>
  new Response(null, {
    status: 303,
    headers: {
      Location: `${SITE.replace(/\/$/, '')}/subscribed?s=${state}`,
      'Cache-Control': 'no-store',
    },
  })

Deno.serve(async (req) => {
  console.log(
    'confirm-subscribe', BUILD,
    'url=', SB_URL ? 'set' : 'MISSING',
    'key=', SB_KEY ? `set(${SB_KEY.length})` : 'MISSING'
  )

  const token = new URL(req.url).searchParams.get('t') ?? ''
  /* Shape-checked before it reaches the database. A malformed uuid makes
     PostgREST answer 400, which would read as a server fault rather than
     a bad link. */
  if (!UUID.test(token)) return to('invalid')

  if (!SB_URL || !SB_KEY) {
    console.error('missing env', { url: Boolean(SB_URL), key: Boolean(SB_KEY) })
    return to('error')
  }

  /* confirmed_at is null in the filter, so a second click cannot rewrite
     the timestamp and the reply below can tell the two apart. */
  const r = await fetch(
    `${SB_URL}/rest/v1/subscribers?confirm_token=eq.${token}&confirmed_at=is.null`,
    {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ confirmed_at: new Date().toISOString() }),
    }
  )

  if (!r.ok) {
    console.error('confirm failed', r.status, r.statusText, await r.text())
    return to('error')
  }

  const rows = await r.json().catch(() => [])
  if (Array.isArray(rows) && rows.length > 0) return to('confirmed')

  /* Zero rows is either an unknown token or one already used. They are
     told apart deliberately: a stale link in an old mail is the common
     case and should not read as a failure. */
  const seen = await fetch(
    `${SB_URL}/rest/v1/subscribers?select=id&confirm_token=eq.${token}`,
    { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
  )
    .then((x) => x.json())
    .catch(() => [])

  return to(Array.isArray(seen) && seen.length > 0 ? 'already' : 'expired')
})
