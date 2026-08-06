import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const USER = Deno.env.get('GMAIL_USER')!
const PASS = Deno.env.get('GMAIL_APP_PASSWORD')!
const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
/* Replies should reach a mailbox that is read. A From nobody answers is
   itself a spam signal. */
const REPLY_TO = Deno.env.get('REPLY_TO') ?? USER

/* Its own banner and its own override, so it cannot be swapped by a
   setting meant for the subscription mail.

   Separate from SITE_URL on purpose: an inbox has to fetch this over
   HTTPS, so it cannot come from a dev server. Point it at storage and it
   works before the site is deployed and after the domain changes. */
const BANNER =
  Deno.env.get('TICKET_BANNER_URL') ??
  `${SITE}/profile/emailbanner/emailticketnotificationbanner.png`
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/* Printed on every run, so the logs say which build actually answered.
   Bump it when the template changes. */
const BUILD = 'v6 matched layout'

const ok = (msg: string) => new Response(msg, { status: 200 })

/* `name` is anonymous visitor input and lands in an email sent from a
   real Gmail account, to an address the same visitor chose. Unescaped,
   that is a way to have this account deliver arbitrary markup to a
   third party under a trusted sender. */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

Deno.serve(async (req) => {
  console.log('notify-approved', BUILD)
  const { record, old_record } = await req.json().catch(() => ({}))

  /* Only the false-to-true crossing. Without this the clearing PATCH
     below re-triggers the webhook and mails the same person again. */
  if (record?.approved !== true || old_record?.approved !== false) {
    return ok('not an approval')
  }
  if (!record.notify_email) return ok('no address')
  if (record.hidden) return ok('hidden')

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: USER, password: PASS },
    },
  })

  const name = String(record.name ?? 'there')
  const design = String(record.design ?? '').trim()
  const kind = design || 'ticket'
  /* Without a design name "Your ticket is in the ticket gallery" reads
     like a stutter, so the fallback drops the qualifier instead. */
  const head = design
    ? `Your ${design} is in the ticket gallery`
    : 'Your ticket is in the gallery'

  /* A localhost link is one of the loudest spam signals there is: not
     routable, not https, and carrying a port. */
  if (/localhost|127\.0\.0\.1/.test(SITE)) {
    console.warn(`SITE_URL is ${SITE} — recipients will get an unreachable link`)
  }

  try {
    await client.send({
      from: `Mizu Portfolio <${USER}>`,
      replyTo: REPLY_TO,
      to: record.notify_email,
      subject: `Your ${kind} is approved, ${name}`,
      /* Transactional mail is expected to carry these. Their absence is
         itself scored against you. */
      headers: {
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        'Auto-Submitted': 'auto-generated',
      },
      content: [
        `Hi ${name},`,
        '',
        `Your ${kind} is approved and is now in the ticket gallery:`,
        '',
        `${SITE}/#gallery`,
        '',
        '記録抹消 / DELETED',
        'Your address is gone from the database. It was kept only long',
        'enough to send this.',
        '',
        'Thank you for making one. I appreciate you taking the time more',
        'than you would probably guess.',
        '',
        'Francis Daniel Genese',
        SITE,
      ].join('\n'),
      /* Tables and inline styles, because Outlook renders mail through
         Word and Gmail strips <head>. Nothing here is a flex row or a
         class, and every colour is stated rather than inherited.

         The outer wrapper stays transparent so the card sits on the
         client's own background; the shadow is ignored by Outlook and
         that is fine. */
      html: `
<!-- Poppins first, a real fallback after. Gmail and Outlook strip
     @font-face, so most inboxes land on the system sans; Apple Mail and
     iOS honour it. The stack is what makes both acceptable rather than
     one of them broken. -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
</style>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0">
  <tr>
    <td align="center" style="padding:40px 12px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0d0d0f;border-radius:14px;overflow:hidden;box-shadow:0 18px 44px rgba(0,0,0,0.42)">

        <tr>
          <td style="padding:0;line-height:0">
            <a href="${esc(SITE)}/#gallery" style="display:block">
              <img src="${esc(BANNER)}"
                   width="600" height="280" alt="Mizu portfolio"
                   style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 44px 0">
            <p style="margin:0 0 20px;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#7d7d87">
              入場券 &nbsp;/&nbsp; Approved
            </p>
            <h1 style="margin:0 0 20px;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:31px;line-height:1.18;font-weight:800;letter-spacing:-0.4px;color:#fafafa">
              ${esc(head)}
            </h1>
            <p style="margin:0;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#c4c4cc">
              Hi <span style="color:#fafafa;font-weight:600">${esc(name)}</span>,
              I have reviewed it and it is now live at the bottom of the page
              with everyone else's.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 44px 0">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#fafafa;border-radius:8px">
                  <a href="${esc(SITE)}/#gallery"
                     style="display:inline-block;padding:15px 30px;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:0.2px;color:#0a0a0b;text-decoration:none">
                    See it in the gallery
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
          <td style="padding:24px 44px 0">
            <p style="margin:0 0 8px;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:#63636d">
              記録抹消 &nbsp;/&nbsp; Deleted
            </p>
            <p style="margin:0;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#9a9aa4">
              Your address is gone from the database. It was kept only long
              enough to send this.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 44px 0">
            <p style="margin:0;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#c4c4cc">
              Thank you for making one. I appreciate you taking the time more
              than you would probably guess.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 44px 40px">
            <p style="margin:0;font-family:'Poppins',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#8a8a93">
              <span style="color:#d4d4d8;font-weight:600">Francis Daniel Genese</span><br />
              <a href="${esc(SITE)}" style="color:#8a8a93;text-decoration:underline">${esc(SITE.replace(/^https?:\/\//, ''))}</a>
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

  /* The consent said one message about this ticket, so the address goes
     as soon as that message is sent. */
  await fetch(`${SB_URL}/rest/v1/tickets?id=eq.${record.id}`, {
    method: 'PATCH',
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ notify_email: null }),
  })

  return ok('sent')
})
