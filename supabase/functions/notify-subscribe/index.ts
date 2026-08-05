import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const USER = Deno.env.get('GMAIL_USER')!
const PASS = Deno.env.get('GMAIL_APP_PASSWORD')!
const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
/* Replies should reach a mailbox that is read. A From nobody answers is
   itself a spam signal. */
const REPLY_TO = Deno.env.get('REPLY_TO') ?? USER

/* Separate from SITE_URL on purpose: an inbox has to fetch this over
   HTTPS, so it cannot come from a dev server. Point it at storage and it
   works before the site is deployed and after the domain changes. */
const BANNER =
  Deno.env.get('BANNER_URL') ?? `${SITE}/profile/emailbanner/emailbannerimg.png`
const SB_URL = Deno.env.get('SUPABASE_URL')!

/* The functions host, not the site: the link has to work before the
   domain exists and keep working after it changes. */
const CONFIRM =
  Deno.env.get('CONFIRM_URL') ?? `${SB_URL}/functions/v1/confirm-subscribe`

/* Printed on every run, so the logs say which build actually answered.
   Bump it when the template changes. */
const BUILD = 'v1 double opt-in'

const ok = (msg: string) => new Response(msg, { status: 200 })

/* The address is anonymous visitor input and lands in an email sent from
   a real Gmail account. Unescaped, that is a way to have this account
   deliver arbitrary markup under a trusted sender. */
const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

Deno.serve(async (req) => {
  console.log('notify-subscribe', BUILD)
  const { record } = await req.json().catch(() => ({}))

  if (!record?.email || !record?.confirm_token) return ok('nothing to send')
  /* Already proven. Without this an admin edit would re-mail someone who
     confirmed months ago. */
  if (record.confirmed_at) return ok('already confirmed')

  /* A localhost link is one of the loudest spam signals there is: not
     routable, not https, and carrying a port. */
  if (/localhost|127\.0\.0\.1/.test(SITE)) {
    console.warn(`SITE_URL is ${SITE} — recipients will get an unreachable link`)
  }

  const link = `${CONFIRM}?t=${encodeURIComponent(record.confirm_token)}`

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
      replyTo: REPLY_TO,
      to: record.email,
      subject: 'Confirm your subscription, one click',
      /* Transactional mail is expected to carry these. Their absence is
         itself scored against you. */
      headers: {
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        'Auto-Submitted': 'auto-generated',
      },
      content: [
        'Hi,',
        '',
        'Someone asked to follow updates from this portfolio using this',
        'address. Open the link below and you are on the list:',
        '',
        link,
        '',
        '一度だけ / ONE CLICK',
        'Nothing is sent until you confirm. If this was not you, ignore',
        'this message and the address is never used.',
        '',
        'Francis Daniel Genese',
        SITE,
      ].join('\n'),
      /* Tables and inline styles, because Outlook renders mail through
         Word and Gmail strips <head>. The outer wrapper is transparent so
         the card sits on the client's own background; the shadow is
         ignored by Outlook and that is fine. */
      html: `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0">
  <tr>
    <td align="center" style="padding:32px 12px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#0d0d0f;box-shadow:0 18px 44px rgba(0,0,0,0.42)">

        <tr>
          <td style="padding:0;line-height:0">
            <a href="${esc(SITE)}" style="display:block">
              <img src="${esc(BANNER)}"
                   width="600" height="280" alt="Mizu portfolio"
                   style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 36px 0">
            <p style="margin:0 0 12px;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8a93">
              瓦版 &nbsp;/&nbsp; Confirm
            </p>
            <h1 style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:#fafafa">
              Confirm your subscription
            </h1>
            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#d4d4d8">
              Someone asked to follow updates from this portfolio using
              ${esc(record.email)}. One click and you are on the list.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 36px 30px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background:#fafafa">
                  <a href="${esc(link)}"
                     style="display:inline-block;padding:13px 26px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#0a0a0b;text-decoration:none">
                    Confirm subscription
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 30px">
            <div style="height:1px;background:#26262a;line-height:1px;font-size:0">&nbsp;</div>
            <p style="margin:16px 0 6px;font-family:'Courier New',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#6f6f78">
              一度だけ &nbsp;/&nbsp; One click
            </p>
            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#a1a1aa">
              Nothing is sent until you confirm. If this was not you,
              ignore this message and the address is never used.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 36px 34px">
            <p style="margin:0 0 18px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#a1a1aa">
              If the button does nothing, paste this into your browser:<br />
              <a href="${esc(link)}" style="color:#d4d4d8;text-decoration:underline;word-break:break-all">${esc(link)}</a>
            </p>
            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a8a93">
              Francis Daniel Genese<br />
              <a href="${esc(SITE)}" style="color:#d4d4d8;text-decoration:underline">${esc(SITE)}</a>
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
