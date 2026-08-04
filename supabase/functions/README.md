# notify-approved

Emails the submitter once, when their ticket is approved, then clears the
stored address.

## Deploy

```bash
npx supabase login
npx supabase link --project-ref sxjlpzqknimhcnotoezh

npx supabase secrets set \
  GMAIL_USER=mizuportfoliotickets@gmail.com \
  GMAIL_APP_PASSWORD='the 16 character app password' \
  SITE_URL=https://your-site.vercel.app

npx supabase functions deploy notify-approved
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.
The service-role key stays inside the function and must never reach the
frontend.

## Webhook

Database → Webhooks → Create.

- Table `public.tickets`, event **Update** only
- Type: Supabase Edge Function → `notify-approved`
- Header: `Authorization: Bearer <service-role key>`

Update-only matters. On insert there is no `old_record`, and the function
would reject it anyway, but firing on every insert wastes invocations.

## Testing

Approve a ticket that has an address. Function logs are under Edge
Functions → notify-approved → Logs.

Gmail SMTP needs a raw TCP connection. If the runtime refuses it, the
error appears in those logs, and the fix is an HTTPS email API instead of
SMTP; everything else in the function stays the same.
