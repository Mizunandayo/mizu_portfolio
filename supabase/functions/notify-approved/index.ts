import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const USER = Deno.env.get('GMAIL_USER')!
const PASS = Deno.env.get('GMAIL_APP_PASSWORD')!
const SITE = Deno.env.get('SITE_URL') ?? 'https://mizu.dev'
/* Replies should reach a mailbox that is read. A From nobody answers is
   itself a spam signal. */
const REPLY_TO = Deno.env.get('REPLY_TO') ?? USER
const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
      subject: `Your ticket is live, ${name}`,
      /* Transactional mail is expected to carry these. Their absence is
         itself scored against you. */
      headers: {
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        'Auto-Submitted': 'auto-generated',
      },
      content: [
        `Hi ${name},`,
        '',
        'You made a ticket on my portfolio and asked to be told when it',
        'went up. I have just reviewed it, and it is now in the gallery',
        'at the bottom of the page:',
        '',
        `${SITE}/#gallery`,
        '',
        'This is the only message you will get about it. The address you',
        'gave has already been deleted from the database.',
        '',
        'Thanks for making one.',
        '',
        'Francis Daniel Genese',
        SITE,
      ].join('\n'),
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.65;color:#18181b;max-width:520px">
          <p>Hi ${esc(name)},</p>
          <p>
            You made a ticket on my portfolio and asked to be told when it
            went up. I have just reviewed it, and it is now in the gallery
            at the bottom of the page.
          </p>
          <p><a href="${esc(SITE)}/#gallery">${esc(SITE)}/#gallery</a></p>
          <p style="color:#71717a;font-size:14px">
            This is the only message you will get about it. The address you
            gave has already been deleted from the database.
          </p>
          <p>
            Thanks for making one.<br />
            Francis Daniel Genese
          </p>
        </div>`,
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
