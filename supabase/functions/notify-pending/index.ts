import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

/* ══════════════════════════════════════════════════
   A ticket has been submitted and is waiting.

   Fired by a database webhook on INSERT into
   public.tickets, not from the browser: a visitor who
   closes the tab the moment they press send must not
   be able to skip the notification, and the client has
   no business knowing the admin's address.

   Goes to the mailbox that sends it unless ADMIN_EMAIL
   says otherwise, so there is one fewer secret to set
   and no address written into the repo.
   ══════════════════════════════════════════════════ */

const USER = Deno.env.get('GMAIL_USER')!
const PASS = Deno.env.get('GMAIL_APP_PASSWORD')!
const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
const TO = Deno.env.get('ADMIN_EMAIL') ?? USER
const SB_URL = Deno.env.get('SUPABASE_URL')!

/* Its own override first, then whatever the approval mail already
   uses, and only then the path on the site. Reusing TICKET_BANNER_URL
   is the point of the middle rung: it is set, so it is known to load in
   an inbox, and this is about a ticket too. The last rung is a guess
   that depends on SITE_URL being right. */
const BANNER =
  Deno.env.get('PENDING_BANNER_URL') ??
  Deno.env.get('TICKET_BANNER_URL') ??
  `${SITE}/profile/emailbanner/emailticketnotificationbanner.png`

/* Printed on every run, so the logs say which build actually answered.
   Bump it when the template changes. */
const BUILD = 'v1'

const ok = (msg: string) => new Response(msg, { status: 200 })

/* The name and message are anonymous visitor input landing in an email
   sent from a real Gmail account. Unescaped, that is a way to have this
   account deliver arbitrary markup under a trusted sender. */
const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/* Same five the editor offers. Inlined rather than imported: an edge
   function cannot reach into src/, and a wrong label here is cosmetic
   where a broken import is a dead notification. */
const DESIGNS: Record<string, string> = {
  stub: '入場券 / Stub',
  tanzaku: '短冊 / Tanzaku',
  pass: '搭乗券 / Boarding pass',
  ofuda: '御札 / Ofuda',
  print: '半券 / Print',
}

const FONT = `'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif`

Deno.serve(async (req) => {
  console.log('notify-pending', BUILD)
  const { record } = await req.json().catch(() => ({}))

  if (!record?.id || !record?.name) return ok('nothing to send')
  /* Only the ones actually waiting. Without this, an admin approving a
     row would trigger a second "please review" for work already done. */
  if (record.approved) return ok('already approved')

  const name = esc(record.name)
  const design = DESIGNS[record.design] ?? esc(record.design ?? 'Unknown')
  const message = record.message?.trim() ? esc(record.message.trim()) : ''
  const shot = record.thumb_path
    ? `${SB_URL}/storage/v1/object/public/tickets/${record.thumb_path}`
    : ''
  const panel = `${SITE.replace(/\/$/, '')}/admin`

  const when = new Date(record.created_at ?? Date.now()).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila',
  })

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: USER, password: PASS },
    },
  })

  try {
    await client.send({
      from: `Mizu Portfolio <${USER}>`,
      to: TO,
      subject: `New ticket from ${record.name}, waiting for review`,
      headers: { 'Auto-Submitted': 'auto-generated' },
      content: [
        `${record.name} submitted a ticket and it is waiting for review.`,
        '',
        `Design:    ${DESIGNS[record.design] ?? record.design ?? 'Unknown'}`,
        `Submitted: ${when}`,
        message ? `Message:   ${record.message.trim()}` : '',
        '',
        'Review it here:',
        panel,
      ]
        .filter(Boolean)
        .join('\n'),
      /* Tables and inline styles, because Outlook renders mail through
         Word and Gmail strips <head>. Same card as the other three. */
      html: `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0">
  <tr>
    <td align="center" style="padding:40px 12px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0d0d0f;border-radius:14px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,0.42)">

        <tr>
          <td style="padding:0;line-height:0">
            <a href="${esc(panel)}" style="display:block">
              <img src="${esc(BANNER)}"
                   width="600" height="280" alt="Mizu portfolio"
                   style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 44px 0">
            <p style="margin:0 0 20px;font-family:${FONT};font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#7d7d87">
              改札口 &nbsp;/&nbsp; Pending
            </p>
            <h1 style="margin:0 0 20px;font-family:${FONT};font-size:31px;line-height:1.18;font-weight:800;letter-spacing:-0.4px;color:#fafafa">
              A ticket is waiting
            </h1>
            <p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.75;color:#c4c4cc">
              <span style="color:#fafafa;font-weight:600">${name}</span>
              just made one. It stays out of the gallery until you
              approve it.
            </p>
          </td>
        </tr>
${
  shot
    ? `
        <tr>
          <td style="padding:28px 44px 0">
            <img src="${esc(shot)}" width="512" alt="The submitted ticket"
                 style="display:block;width:100%;max-width:512px;height:auto;border:0;border-radius:10px;outline:none;text-decoration:none" />
          </td>
        </tr>`
    : ''
}
        <tr>
          <td style="padding:28px 44px 0">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#131318;border-radius:8px">
              <tr>
                <td style="padding:16px 18px;font-family:${FONT};font-size:13px;line-height:1.9;color:#9a9aa4">
                  <span style="color:#63636d">Name</span> &nbsp; <span style="color:#e4e4e8;font-weight:600">${name}</span><br />
                  <span style="color:#63636d">Design</span> &nbsp; <span style="color:#e4e4e8">${design}</span><br />
                  <span style="color:#63636d">Submitted</span> &nbsp; <span style="color:#e4e4e8">${esc(when)}</span>
                  ${
                    message
                      ? `<br /><span style="color:#63636d">Message</span> &nbsp; <span style="color:#e4e4e8">${message}</span>`
                      : ''
                  }
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 44px 0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#fafafa;border-radius:8px">
                  <a href="${esc(panel)}"
                     style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:14px;font-weight:700;letter-spacing:0.2px;color:#0a0a0b;text-decoration:none">
                    Review it
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 44px 0">
            <div style="height:1px;background:#212127;line-height:1px;font-size:0">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 44px 40px">
            <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.7;color:#8a8a93">
              <span style="color:#d4d4d8;font-weight:600">Mizu Portfolio</span><br />
              <a href="${esc(SITE)}" style="color:#8a8a93;text-decoration:underline">${esc(
                SITE.replace(/^https?:\/\//, '')
              )}</a>
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>`,
    })
  } finally {
    await client.close()
  }

  return ok('sent')
})
