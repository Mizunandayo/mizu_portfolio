/* The List-Unsubscribe target and the footer link in every broadcast.
   Deployed with --no-verify-jwt: it is opened from a mail client, which
   cannot carry a Supabase key. unsub_token is the only credential, and
   it is a v4 uuid absent from anon's grants in both directions.

   Redirects rather than answering with a page, for the same reason
   confirm-subscribe does: an Edge Function's output is served as
   text/plain with nosniff, so a browser will not render markup from
   here whatever Content-Type is set. */

const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''

const BUILD = 'v1'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const to = (state: string) =>
  new Response(null, {
    status: 303,
    headers: {
      Location: `${SITE.replace(/\/$/, '')}/subscribed?s=${state}`,
      'Cache-Control': 'no-store',
    },
  })

Deno.serve(async (req) => {
  console.log('unsubscribe', BUILD)

  const token = new URL(req.url).searchParams.get('u') ?? ''
  if (!UUID.test(token)) return to('invalid')
  if (!SB_URL || !SB_KEY) return to('error')

  /* One-click unsubscribe sends a POST rather than a GET, and RFC 8058
     wants it honoured without a confirmation step. Same work either way,
     so the method is not checked; only the answer differs. */
  const r = await fetch(
    `${SB_URL}/rest/v1/subscribers?unsub_token=eq.${token}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }),
    }
  )

  if (!r.ok) {
    console.error('unsubscribe failed', r.status, await r.text())
    return to('error')
  }

  const rows = await r.json().catch(() => [])
  const done = Array.isArray(rows) && rows.length > 0

  /* A mail client acting on List-Unsubscribe-Post wants a plain 200 and
     will not follow a redirect anywhere useful. */
  if (req.method === 'POST') {
    return new Response(done ? 'unsubscribed' : 'unknown', {
      status: done ? 200 : 404,
    })
  }

  return to(done ? 'unsubscribed' : 'expired')
})
