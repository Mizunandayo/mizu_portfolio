import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

/* Broadcast to the confirmed list. Called from the admin panel with the
   signed-in admin's own token, never a shared key: the uid is checked
   against public.admins before a single address is read, so possession
   of the anon key gets you nothing here.

   One message per recipient rather than one BCC to everybody. It costs
   more sends, but it is the only way each person can get their own
   working unsubscribe link, and it keeps the list private by
   construction rather than by remembering to use the right field. */

const USER = Deno.env.get('GMAIL_USER')!
const PASS = Deno.env.get('GMAIL_APP_PASSWORD')!
const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
const REPLY_TO = Deno.env.get('REPLY_TO') ?? USER
const BANNER =
  Deno.env.get('BANNER_URL') ?? `${SITE}/profile/emailbanner/emailbannerimg.png`
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''

const UNSUB =
  Deno.env.get('UNSUB_URL') ?? `${SB_URL}/functions/v1/unsubscribe`

const BUILD = 'v4 logs what it sent'

/* Gmail will not take an unbounded run in one connection, and a runaway
   loop is the expensive kind of mistake. */
const MAX = 400

/* Called from the browser, so the preflight has to be answered or the
   real request is never sent. Origin is open because the credential is
   the admin's own bearer token: another site can make the request but
   cannot obtain the token to put in it. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

/* Only http(s), and only a real URL. It lands in an img src in mail sent
   from a real account, so javascript: and data: have no business here. */
function safeBanner(v: unknown): string | null {
  const raw = String(v ?? '').trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/* Paragraphs from blank lines, <br> from single ones. Anything the
   admin types is escaped first, so this cannot be used to inject markup
   into mail sent from a real account. */
const para = (s: string) =>
  esc(s)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#d4d4d8">${p.replace(/\n/g, '<br />')}</p>`
    )
    .join('')

const admin = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })

  console.log('send-update', BUILD)

  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)
  if (!SB_KEY) return json({ error: 'Service key missing from this function' }, 500)

  /* Whoever is calling, proven against auth and then against the admins
     table. Two steps on purpose: a valid token only says "a user", and
     any visitor can get one of those. */
  const bearer = req.headers.get('Authorization') ?? ''
  const who = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: SB_KEY, Authorization: bearer },
  })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  if (!who?.id) return json({ error: 'Not signed in' }, 401)

  /* A failed lookup and a genuine non-admin are told apart. Folding them
     together is how a missing grant on public.admins spent a while
     looking like the right answer to the wrong question. */
  const check = await fetch(
    `${SB_URL}/rest/v1/admins?select=id&id=eq.${who.id}`,
    { headers: admin }
  )

  if (!check.ok) {
    const why = await check.text()
    console.error('admin lookup failed', check.status, why)
    return json(
      {
        error:
          `Could not check admin rights (${check.status}). ` +
          'The service role probably lacks SELECT on public.admins.',
      },
      500
    )
  }

  const isAdmin = await check.json().catch(() => [])

  if (!Array.isArray(isAdmin) || isAdmin.length === 0) {
    console.warn('rejected non-admin', who.id)
    return json({ error: 'That account is not an admin.' }, 403)
  }

  const body = await req.json().catch(() => null)
  const subject = String(body?.subject ?? '').trim()
  const heading = String(body?.heading ?? '').trim()
  const message = String(body?.body ?? '').trim()
  const ctaLabel = String(body?.ctaLabel ?? '').trim()
  const ctaPath = String(body?.ctaPath ?? '').trim()
  const mode = body?.mode === 'recruiter' ? 'recruiter' : 'personal'
  const banner = safeBanner(body?.banner) ?? BANNER
  const ids: string[] | null = Array.isArray(body?.ids) ? body.ids : null
  const test = Boolean(body?.test)

  if (!subject || !heading || !message) {
    return json({ error: 'Subject, heading and message are all required.' }, 400)
  }

  /* ?mode= is read before first paint by the inline script in
     index.html, so the link decides which presentation they land in.
     The hash has to come last or it is part of the query string. */
  const base = SITE.replace(/\/$/, '')
  const hash = ctaPath.startsWith('#') ? ctaPath : ''
  const link = `${base}/?mode=${mode}${hash}`

  /* A dry run mails the admin alone and touches nobody else. */
  let people: { id: string; email: string; unsub_token: string }[]

  if (test) {
    people = [{ id: 'test', email: who.email, unsub_token: '00000000-0000-4000-8000-000000000000' }]
  } else {
    let q =
      `${SB_URL}/rest/v1/subscribers?select=id,email,unsub_token` +
      `&confirmed_at=not.is.null&unsubscribed_at=is.null&limit=${MAX}`
    if (ids) {
      if (ids.length === 0) return json({ error: 'Nobody selected.' }, 400)
      q += `&id=in.(${ids.map(encodeURIComponent).join(',')})`
    }

    people = await fetch(q, { headers: admin })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])
  }

  if (!Array.isArray(people) || people.length === 0) {
    return json({ error: 'No confirmed subscribers to send to.' }, 400)
  }

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: USER, password: PASS },
    },
  })

  let sent = 0
  const failed: string[] = []

  try {
    for (const p of people) {
      const off = `${UNSUB}?u=${encodeURIComponent(p.unsub_token)}`

      try {
        await client.send({
          from: `Mizu Portfolio <${USER}>`,
          replyTo: REPLY_TO,
          to: p.email,
          subject,
          headers: {
            'List-Unsubscribe': `<${off}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Auto-Submitted': 'auto-generated',
          },
          content: [
            heading,
            '',
            message,
            '',
            ctaLabel ? `${ctaLabel}: ${link}` : link,
            '',
            'Francis Daniel Genese',
            SITE,
            '',
            `Unsubscribe: ${off}`,
          ].join('\n'),
          html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0">
  <tr>
    <td align="center" style="padding:32px 12px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0d0d0f;box-shadow:0 18px 44px rgba(0,0,0,0.42)">

        <tr>
          <td style="padding:0;line-height:0">
            <a href="${esc(link)}" style="display:block">
              <img src="${esc(banner)}"
                   width="600" height="280" alt="Mizu portfolio"
                   style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px 0">
            <p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8a93">
              瓦版 &nbsp;/&nbsp; Kawaraban
            </p>
            <h1 style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:#fafafa">
              ${esc(heading)}
            </h1>
            ${para(message)}
          </td>
        </tr>

        ${
          ctaLabel
            ? `<tr>
          <td style="padding:14px 36px 30px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#fafafa">
                  <a href="${esc(link)}"
                     style="display:inline-block;padding:13px 26px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#0a0a0b;text-decoration:none">
                    ${esc(ctaLabel)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : '<tr><td style="padding:0 36px 16px"></td></tr>'
        }

        <tr>
          <td style="padding:0 36px 34px">
            <div style="height:1px;background:#26262a;line-height:1px;font-size:0">&nbsp;</div>
            <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a8a93">
              Francis Daniel Genese<br />
              <a href="${esc(link)}" style="color:#d4d4d8;text-decoration:underline">${esc(base)}</a>
            </p>
            <p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6f6f78">
              You are getting this because you subscribed to updates from
              this portfolio.
              <a href="${esc(off)}" style="color:#8a8a93;text-decoration:underline">Unsubscribe</a>.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`,
        })
        sent++
      } catch (e) {
        console.error('send failed', p.email, String(e))
        failed.push(p.email)
      }
    }
  } finally {
    await client.close()
  }

  /* Logged after the run, not before, so what the panel shows is what
     actually left rather than what was attempted. A test is recorded
     too, flagged, because "did I already try this" is worth answering. */
  const reached = people.filter((p) => !failed.includes(p.email)).map((p) => p.email)

  const logged = await fetch(`${SB_URL}/rest/v1/sent_emails`, {
    method: 'POST',
    headers: { ...admin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject, heading, body: message,
      cta_label: ctaLabel || null,
      cta_path: ctaPath || null,
      mode, banner,
      recipients: reached,
      failed,
      sent_count: sent,
      is_test: test,
      sent_by: who.id,
    }),
  })

  if (!logged.ok) {
    console.error('log failed', logged.status, await logged.text())
  }

  console.log(`send-update sent=${sent} failed=${failed.length} test=${test}`)
  return json({ sent, failed, total: people.length })
})
