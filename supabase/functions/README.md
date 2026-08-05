# Edge Functions

Five, all sending from the same Gmail account:

| Function | Trigger | Does |
| --- | --- | --- |
| `notify-approved` | webhook, `tickets` update | Mails the submitter when their ticket is approved, then clears the stored address |
| `notify-subscribe` | webhook, `subscribers` insert | Mails the confirm link for a new signup |
| `confirm-subscribe` | the link in that mail | Stamps `confirmed_at`, redirects to `/subscribed` |
| `send-update` | the admin panel | Broadcasts one message per confirmed subscriber |
| `unsubscribe` | the footer link in a broadcast | Stamps `unsubscribed_at`, redirects to `/subscribed` |

## Deploy

```bash
npx supabase login
npx supabase link --project-ref sxjlpzqknimhcnotoezh

npx supabase secrets set \
  GMAIL_USER=mizutickets@gmail.com \
  GMAIL_APP_PASSWORD='the 16 character app password' \
  SITE_URL=https://your-site.vercel.app

npx supabase functions deploy notify-approved
npx supabase functions deploy notify-subscribe
npx supabase functions deploy send-update
npx supabase functions deploy confirm-subscribe --no-verify-jwt
npx supabase functions deploy unsubscribe --no-verify-jwt
```

`--no-verify-jwt` on the last two is not optional. Those URLs are opened
from a mail client, which cannot send a Supabase key. Their only
credential is the uuid in the query string, and neither `confirm_token`
nor `unsub_token` appears in anon's grants in either direction, so a
token cannot be read out or guessed at scale.

`send-update` is the opposite and must keep JWT verification: the admin
panel calls it with the signed-in user's own token, and the function
checks that uid against `public.admins` before reading a single address.

## Grants

`service_role` needs DML on both tables. Supabase normally does this
through default privileges, but that depends on which role created the
table and cannot be assumed. Without it every function authenticates
fine and then gets 403 on write, which is silent in `notify-approved`
and looked like a broken link in `confirm-subscribe`:

```sql
grant all on public.subscribers to service_role;
grant all on public.tickets to service_role;
```

Check with:

```sql
select grantee, string_agg(privilege_type, ', ' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'subscribers'
group by grantee;
```

## Webhooks

Database → Webhooks. Both need `Authorization: Bearer <service-role key>`.

**notify-approved** — table `public.tickets`, event **Update** only. On
insert there is no `old_record`, and firing on every insert wastes
invocations.

**notify-subscribe** — table `public.subscribers`, event **Insert** only.
Confirming is an update, and firing on updates would mail a fresh link
every time someone is confirmed, unsubscribed, or restored.

## Why the two link handlers redirect

An Edge Function cannot serve a page. Everything they return is sent as
`Content-Type: text/plain` with `X-Content-Type-Options: nosniff` and a
sandbox CSP, whatever the code sets, so a browser will render the markup
as text. Supabase does this deliberately, to stop anyone hosting a
convincing page on a `supabase.co` domain. So both handlers do their
write and answer `303` to `${SITE_URL}/subscribed?s=<outcome>`, and the
page lives in the site where it can look like the site.

This is why `SITE_URL` matters more than it looks. Point it at localhost
and every confirm link mails people a redirect to their own machine.

## How a signup goes

1. The form inserts `email` and `source`. Everything else on the row is a
   default the browser cannot set.
2. `subscribers_guard` normalises the address and decides what the insert
   means. A repeat inside five minutes is dropped silently, so
   resubmitting cannot be used to mail-bomb someone else's inbox. After
   five minutes it replaces the row, minting a new token and firing the
   webhook again, which is the resend path.
3. `notify-subscribe` mails the link.
4. `confirm-subscribe` patches `confirmed_at` where the token matches
   **and** `confirmed_at is null`, so a second click cannot rewrite the
   timestamp and the two cases can be told apart.

Nothing is ever sent to an address that has not been through step 4.

## Broadcasts

`send-update` sends one message per recipient rather than one BCC to
everybody. It costs more sends, but it is the only way each person gets a
working unsubscribe link, and the list stays private by construction
rather than by remembering to use the right field. Capped at 400 per call;
Gmail allows roughly 500 recipients a day.

Every broadcast carries `List-Unsubscribe` and `List-Unsubscribe-Post`,
so a one-click unsubscribe in Gmail hits the `unsubscribe` function
directly with a POST, which it answers with a plain 200 rather than a
redirect because a mail client will not follow one anywhere useful.

The link in each broadcast is `/?mode=personal|recruiter#section`. The
inline script in `index.html` reads `?mode=` before first paint and
stores it, so the recipient lands in whichever presentation the email
chose.

## Testing

Each function prints its `BUILD` string on every invocation, so the log
says which version actually answered. Logs are under Edge Functions →
the function → Logs.

The compose panel has **Send a test to myself**, which mails only the
signed-in admin and touches nobody else. Use it before every real send.
