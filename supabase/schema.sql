-- Ticket gallery. Run once in the SQL editor.
-- The anon key is public, so every rule that matters lives here.

create table if not exists public.tickets (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 1 and 40),
  design      text        not null check (char_length(design) <= 40),
  message     text                 check (char_length(message) <= 500),
  thumb_path  text        not null,
  plate_path  text,
  approved    boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists tickets_approved_created_idx
  on public.tickets (approved, created_at desc);

alter table public.tickets enable row level security;

-- Column lists, not a bare table grant: GRANT SELECT on a table covers
-- every column and a column-level REVOKE cannot take it back. This is
-- the only thing keeping submitted_ip unreadable.
grant select (id, name, design, message, thumb_path, plate_path, approved, created_at)
  on public.tickets to anon;
grant insert (name, design, message, thumb_path, plate_path)
  on public.tickets to anon;
grant select, insert, update, delete on public.tickets to authenticated;


-- Populate by hand after creating your account:
--   insert into public.admins (id) values ('<your-auth-uid>');
create table if not exists public.admins (
  id uuid primary key references auth.users (id) on delete cascade
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.id = auth.uid());
$$;


-- ══════════════════════════════════════════════════
-- Client IP, read correctly.
--
-- x-forwarded-for is NOT safe to read from the left. Cloudflare appends
-- the real address to whatever the caller already sent, so a request
-- carrying "X-Forwarded-For: 9.9.9.9" arrives as "9.9.9.9, <real ip>"
-- and split_part(...,',',1) hands back the attacker's own string. Every
-- rate limit below used to read it that way and could be stepped past by
-- varying one header.
--
-- cf-connecting-ip is set by the edge and cannot be forged by the
-- client. XFF stays as a fallback, but read from the RIGHT, which is the
-- last hop that actually appended and the closest thing to trustworthy
-- if the header is missing.
-- ══════════════════════════════════════════════════
create or replace function public.client_ip()
returns text
language plpgsql
stable
as $$
declare
  h json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  cf text := btrim(coalesce(h ->> 'cf-connecting-ip', ''));
  xf text := coalesce(h ->> 'x-forwarded-for', '');
begin
  if cf <> '' then
    return cf;
  end if;
  return btrim(split_part(xf, ',', greatest(1, array_length(string_to_array(xf, ','), 1))));
end;
$$;


-- Approved but hideable: the gate is here, not in the client query, so
-- a hidden ticket is unreachable however the API is called.
alter table public.tickets
  add column if not exists hidden boolean not null default false;

drop policy if exists tickets_public_read on public.tickets;
create policy tickets_public_read
  on public.tickets for select
  to anon, authenticated
  using (approved = true and hidden = false);

drop policy if exists tickets_public_insert on public.tickets;
create policy tickets_public_insert
  on public.tickets for insert
  to anon, authenticated
  with check (approved = false);

-- No visitor update or delete policy. With RLS on, omission is denial.

drop policy if exists tickets_admin_read on public.tickets;
create policy tickets_admin_read
  on public.tickets for select
  to authenticated
  using (public.is_admin());

drop policy if exists tickets_admin_update on public.tickets;
create policy tickets_admin_update
  on public.tickets for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists tickets_admin_delete on public.tickets;
create policy tickets_admin_delete
  on public.tickets for delete
  to authenticated
  using (public.is_admin());


-- Storage. "Public" only makes objects readable; writing needs this.
-- Not covered by the rate limit below, which guards the table only.
-- Both roles: a signed-in admin making their own ticket uploads as
-- authenticated, and an anon-only policy silently rejects them.
drop policy if exists tickets_anon_upload on storage.objects;
create policy tickets_anon_upload
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'tickets');

-- Deleting needs SELECT too: storage resolves which rows match before it
-- removes them, and with no read policy it matches none, deletes none,
-- and answers 200 with an empty list.
drop policy if exists tickets_admin_object_read on storage.objects;
create policy tickets_admin_object_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'tickets' and public.is_admin());

drop policy if exists tickets_admin_object_delete on storage.objects;
create policy tickets_admin_object_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'tickets' and public.is_admin());


-- Optional, for "tell me when it is approved". Writable by visitors,
-- never readable by them: it is granted for insert only, so one person
-- cannot harvest another's address.
alter table public.tickets
  add column if not exists notify_email text;

do $$ begin
  alter table public.tickets add constraint tickets_notify_email_fmt
    check (notify_email is null
           or notify_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$');
exception when duplicate_object then null; end $$;

grant insert (notify_email) on public.tickets to anon;

-- Added after the grants above so it never lands in anon's column list.
alter table public.tickets
  add column if not exists submitted_ip text;

-- A name of spaces, ideographic spaces or zero-width joiners has a
-- char_length above zero and renders as nothing, so a length check does
-- not stop a blank ticket. Enforced here rather than only in the browser:
-- the anon key is public and anyone can POST straight at the API.
--
-- One definition, used by both the constraint and the trigger below, so
-- the two cannot drift apart. The explicit code points are the invisible
-- characters that [:space:] does not cover in every locale: NBSP, the
-- en/em quads, the zero-width joiners, the ideographic space, the BOM.
create or replace function public.tidy_name(t text)
returns text
language sql
immutable
as $$
  with s as (
    select chr(160)||chr(5760)||chr(8192)||chr(8193)||chr(8194)||chr(8195)
        || chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)
        || chr(8202)||chr(8203)||chr(8204)||chr(8205)||chr(8232)||chr(8233)
        || chr(8239)||chr(8287)||chr(8288)||chr(12288)||chr(65279) as odd
  )
  select left(btrim(regexp_replace(
           translate(coalesce(t, ''), s.odd, repeat(' ', length(s.odd))),
           '[[:cntrl:][:space:]]+', ' ', 'g')), 40)
  from s
$$;

do $$ begin
  alter table public.tickets add constraint tickets_name_not_blank
    check (public.tidy_name(name) <> '') not valid;
exception when duplicate_object then null; end $$;

-- Confirm the header name for your project before trusting the numbers.
create or replace function public.tickets_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ip text := public.client_ip();
  recent int;
  wait_min int;
begin
  new.name := public.tidy_name(new.name);

  if new.name = '' then
    raise exception 'Your ticket needs a name.';
  end if;

  if public.is_admin() then
    return new;
  end if;

  -- One in the queue at a time, per address.
  if new.notify_email is not null and exists (
    select 1 from public.tickets
    where notify_email = new.notify_email and approved = false
  ) then
    raise exception
      'You already have a ticket waiting for review. Once it is approved you can send another.';
  end if;

  if ip = '' then
    return new;
  end if;

  select count(*) into recent
  from public.tickets
  where submitted_ip = ip
    and created_at > now() - interval '1 hour';

  -- Rolling window, so the wait is measured from the oldest of the
  -- recent three rather than from now.
  if recent >= 3 then
    select greatest(1, ceil(
             extract(epoch from (min(created_at) + interval '1 hour' - now())) / 60))
      into wait_min
    from public.tickets
    where submitted_ip = ip and created_at > now() - interval '1 hour';

    raise exception 'You have sent a few tickets already. Please try again in about % %.',
      wait_min,
      case when wait_min = 1 then 'minute' else 'minutes' end;
  end if;

  new.submitted_ip := ip;
  return new;
end;
$$;

drop trigger if exists tickets_rate_limit_trg on public.tickets;
create trigger tickets_rate_limit_trg
  before insert on public.tickets
  for each row execute function public.tickets_rate_limit();

-- ══════════════════════════════════════════════════
-- Subscribers. Write-only from the browser: a visitor can add an
-- address and learn nothing else, so the table cannot be read back as a
-- mailing list by whoever finds the anon key.
-- ══════════════════════════════════════════════════

create table if not exists public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text        not null,
  -- Minted at signup so a future broadcast has a per-recipient
  -- unsubscribe link without having to backfill one.
  unsub_token     uuid        not null default gen_random_uuid(),
  unsubscribed_at timestamptz,
  source          text,
  submitted_ip    text,
  created_at      timestamptz not null default now()
);

do $$ begin
  alter table public.subscribers add constraint subscribers_email_fmt
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$'
           and char_length(email) <= 254);
exception when duplicate_object then null; end $$;

-- Case-insensitive, so Someone@x.com cannot subscribe twice.
create unique index if not exists subscribers_email_key
  on public.subscribers (lower(email));

alter table public.subscribers enable row level security;

-- Insert only, and only these columns. No select grant at all, so there
-- is no query that returns an address; unsub_token and submitted_ip are
-- not writable, so neither can be chosen by the person signing up.
grant insert (email, source) on public.subscribers to anon;
grant select, insert, update, delete on public.subscribers to authenticated;

-- Stated rather than inherited. Supabase normally hands new public tables
-- to service_role through default privileges, but that depends on which
-- role created the table and cannot be assumed. Without it the Edge
-- Functions authenticate fine and then get 403 on every write, which is
-- what confirming a subscription did.
grant all on public.subscribers to service_role;
grant all on public.tickets to service_role;
-- admins too: send-update reads it to check who is calling, and without
-- this that read is refused and every caller looks like a stranger.
grant all on public.admins to service_role;

drop policy if exists subscribers_public_insert on public.subscribers;
create policy subscribers_public_insert
  on public.subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists subscribers_admin_all on public.subscribers;
create policy subscribers_admin_all
  on public.subscribers for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Double opt-in. confirm_token is not in anon's insert grant, so the
-- person signing up cannot choose it and cannot confirm themselves.
alter table public.subscribers
  add column if not exists confirmed_at  timestamptz,
  add column if not exists confirm_token uuid not null default gen_random_uuid();

create index if not exists subscribers_confirm_token_idx
  on public.subscribers (confirm_token);

-- A duplicate would come back as a 409 unique violation, which turns the
-- form into an oracle for "is this address on the list". Returning null
-- from a BEFORE INSERT trigger drops the row silently, so every repeat
-- signup answers exactly like a first one whatever it actually did.
create or replace function public.subscribers_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ip text := public.client_ip();
  recent int;
  prior  public.subscribers%rowtype;
begin
  new.email := lower(btrim(new.email));

  select * into prior from public.subscribers
   where lower(email) = new.email;

  if found then
    -- Confirmed once, so ownership is already proven. Coming back after
    -- an unsubscribe just clears the flag; no second round trip.
    if prior.confirmed_at is not null then
      if prior.unsubscribed_at is not null then
        update public.subscribers set unsubscribed_at = null where id = prior.id;
      end if;
      return null;
    end if;

    -- Still unconfirmed. A fresh signup means the first mail probably
    -- never arrived, so the row is replaced to mint a new token and fire
    -- the webhook again. Rate limited on its own clock: without this,
    -- resubmitting the form is a way to mail-bomb someone else's inbox.
    if prior.created_at > now() - interval '5 minutes' then
      return null;
    end if;

    delete from public.subscribers where id = prior.id;
  end if;

  if ip <> '' then
    select count(*) into recent
    from public.subscribers
    where submitted_ip = ip and created_at > now() - interval '1 hour';

    if recent >= 5 then
      raise exception 'That is a few sign-ups from here already. Try again later.';
    end if;

    new.submitted_ip := ip;
  end if;

  return new;
end;
$$;

drop trigger if exists subscribers_guard_trg on public.subscribers;
create trigger subscribers_guard_trg
  before insert on public.subscribers
  for each row execute function public.subscribers_guard();

-- Confirming is a token lookup, not a session, so it runs as the service
-- role inside the Edge Function. Nothing here is reachable with the anon
-- key: anon has no select grant, so a token cannot even be tested.


-- ══════════════════════════════════════════════════
-- Sent broadcasts. Written by send-update after the run, so the panel
-- can show what went out and to whom. Admin-only in both directions:
-- anon holds no grant at all, not even insert.
-- ══════════════════════════════════════════════════

create table if not exists public.sent_emails (
  id          uuid primary key default gen_random_uuid(),
  subject     text        not null,
  heading     text        not null,
  body        text        not null,
  cta_label   text,
  cta_path    text,
  mode        text        not null default 'personal',
  banner      text,
  -- The addresses themselves, not just a count: "who got this" is the
  -- question you actually ask of a sent item, and a count cannot answer
  -- it once the list has moved on.
  recipients  text[]      not null default '{}',
  failed      text[]      not null default '{}',
  sent_count  int         not null default 0,
  is_test     boolean     not null default false,
  sent_by     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists sent_emails_created_idx
  on public.sent_emails (created_at desc);

alter table public.sent_emails enable row level security;

grant select, insert, update, delete on public.sent_emails to authenticated;
grant all on public.sent_emails to service_role;

drop policy if exists sent_emails_admin_all on public.sent_emails;
create policy sent_emails_admin_all
  on public.sent_emails for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ══════════════════════════════════════════════════
-- Project likes.
--
-- No accounts, so identity is a uuid the browser mints and keeps. That
-- is a convenience, not a control: the client sends it and the client
-- can change it. The IP throttle is the only real limit, and it is
-- deliberately loose enough that a whole carrier behind one CGNAT
-- address is not silenced by whoever clicked first.
--
-- Who liked what is never readable. Counts live in their own table and
-- that is the only thing anon can select.
-- ══════════════════════════════════════════════════

create table if not exists public.project_likes (
  slug        text        not null,
  visitor_key uuid        not null,
  ip          text,
  created_at  timestamptz not null default now(),
  primary key (slug, visitor_key)
);

create index if not exists project_likes_ip_idx
  on public.project_likes (ip, created_at desc);

create table if not exists public.project_stats (
  slug  text primary key,
  likes int not null default 0
);

alter table public.project_likes enable row level security;
alter table public.project_stats enable row level security;

-- Counts are public, identities are not. project_likes gets no anon
-- grant at all, so there is no query that returns a visitor_key.
grant select on public.project_stats to anon, authenticated;
grant all on public.project_stats to service_role;
grant all on public.project_likes to service_role;
grant select, insert, update, delete on public.project_likes to authenticated;

drop policy if exists project_stats_read on public.project_stats;
create policy project_stats_read
  on public.project_stats for select
  to anon, authenticated
  using (true);

drop policy if exists project_likes_admin on public.project_likes;
create policy project_likes_admin
  on public.project_likes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The count follows the rows rather than being written alongside them,
-- so the two cannot disagree however the table is edited.
create or replace function public.project_likes_tally()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  s text := coalesce(new.slug, old.slug);
begin
  insert into public.project_stats (slug, likes)
  values (s, (select count(*) from public.project_likes where slug = s))
  on conflict (slug) do update set likes = excluded.likes;
  return null;
end;
$$;

drop trigger if exists project_likes_tally_trg on public.project_likes;
create trigger project_likes_tally_trg
  after insert or delete on public.project_likes
  for each row execute function public.project_likes_tally();

-- The only way in. Anon has no table grant, so a like cannot be written
-- except through this, which means the throttle cannot be skipped.
create or replace function public.toggle_like(p_slug text, p_key uuid)
returns table (slug text, likes int, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip   text := public.client_ip();
  recent int;
  had    boolean;
begin
  if p_slug is null or btrim(p_slug) = '' or char_length(p_slug) > 60 then
    raise exception 'Unknown project.';
  end if;

  select exists (
    select 1 from public.project_likes
    where project_likes.slug = p_slug and visitor_key = p_key
  ) into had;

  if had then
    delete from public.project_likes
    where project_likes.slug = p_slug and visitor_key = p_key;
  else
    -- Counted on the way in only. Undoing a like is not abuse and
    -- should never be what uses up the allowance.
    if v_ip <> '' then
      select count(*) into recent
      from public.project_likes
      where project_likes.ip = v_ip and created_at > now() - interval '1 hour';

      if recent >= 40 then
        raise exception 'That is a lot of likes from here. Try again later.';
      end if;
    end if;

    insert into public.project_likes (slug, visitor_key, ip)
    values (p_slug, p_key, nullif(v_ip, ''))
    on conflict do nothing;
  end if;

  return query
    select p_slug,
           coalesce((select ps.likes from public.project_stats ps where ps.slug = p_slug), 0),
           not had;
end;
$$;

revoke all on function public.toggle_like(text, uuid) from public;
grant execute on function public.toggle_like(text, uuid) to anon, authenticated;


-- ══════════════════════════════════════════════════
-- Hardening.
--
-- Everything below closes a gap where the public anon key reached
-- further than the feature it belongs to.
-- ══════════════════════════════════════════════════

-- 1. Storage uploads were bounded only by "is this the tickets bucket",
-- which made the bucket an open file host: the anon key is public, so
-- anyone could POST objects into it forever without touching the site.
-- The table rate limit never applied, because it guards the table.
--
-- submit() writes the row first and then uploads to the paths that row
-- names, so an upload can be required to be one a ticket already
-- claimed. That inherits the 3-per-hour limit, and a duplicate POST
-- already fails, so it caps at six files an hour.
--
-- Security definer is load-bearing: a pending ticket is approved =
-- false, so anon's own SELECT policy cannot see it and a plain exists()
-- would refuse every upload.
create or replace function public.ticket_path_claimed(p text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.tickets
    where thumb_path = p or plate_path = p
  );
$$;

drop policy if exists tickets_anon_upload on storage.objects;
create policy tickets_anon_upload
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'tickets'
    and (public.is_admin() or public.ticket_path_claimed(name))
  );


-- 2. design was length-checked but not value-checked, so a direct POST
-- could put arbitrary text in the approval email's subject line. It is
-- escaped, so it could never inject markup, but it could say anything.
do $$ begin
  alter table public.tickets add constraint tickets_design_known
    check (design in ('Stub', 'Tanzaku', 'Boarding pass', 'Ofuda', 'Print'))
    not valid;
exception when duplicate_object then null; end $$;


-- 3. toggle_like accepted any string, so junk slugs could be written
-- forever. project_stats doubles as the allowlist: a like is refused
-- unless a row already exists for that slug. Adding a project is one
-- insert here, which is the same work as adding it to a separate list
-- and one less concept to keep in step.
insert into public.project_stats (slug, likes) values
  ('mitsu', 0), ('minari', 0), ('misaki', 0), ('mirai', 0), ('miwa', 0),
  ('bacsal', 0), ('galactic-conquest', 0), ('hirna', 0), ('eye2wear', 0)
on conflict (slug) do nothing;

create or replace function public.toggle_like(p_slug text, p_key uuid)
returns table (slug text, likes int, liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip   text := public.client_ip();
  recent int;
  had    boolean;
begin
  if not exists (select 1 from public.project_stats ps where ps.slug = p_slug) then
    raise exception 'Unknown project.';
  end if;

  select exists (
    select 1 from public.project_likes
    where project_likes.slug = p_slug and visitor_key = p_key
  ) into had;

  if had then
    delete from public.project_likes
    where project_likes.slug = p_slug and visitor_key = p_key;
  else
    -- Counted on the way in only. Undoing a like is not abuse and
    -- should never be what uses up the allowance.
    if v_ip <> '' then
      select count(*) into recent
      from public.project_likes
      where project_likes.ip = v_ip and created_at > now() - interval '1 hour';

      if recent >= 40 then
        raise exception 'That is a lot of likes from here. Try again later.';
      end if;
    end if;

    insert into public.project_likes (slug, visitor_key, ip)
    values (p_slug, p_key, nullif(v_ip, ''))
    on conflict do nothing;
  end if;

  return query
    select p_slug,
           coalesce((select ps.likes from public.project_stats ps where ps.slug = p_slug), 0),
           not had;
end;
$$;

revoke all on function public.toggle_like(text, uuid) from public;
grant execute on function public.toggle_like(text, uuid) to anon, authenticated;


-- ══════════════════════════════════════════════════
-- Total views.
--
-- One row per browser session rather than a bare counter, which is what
-- makes the number mean something: a reload does not add to it, and the
-- rows are what the per-address cap is enforced against. A portfolio
-- will not see enough of them for count(*) to be worth optimising away.
--
-- Replaces the presence heartbeat, which wrote a row per tab every
-- twenty seconds to hold a number that was almost always 1. If that
-- table is still in your database:
--   drop function if exists public.touch_presence(uuid);
--   drop table if exists public.page_presence;
-- ══════════════════════════════════════════════════

create table if not exists public.page_views (
  session_id uuid        primary key,
  ip         text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_ip_idx
  on public.page_views (ip, created_at desc);

alter table public.page_views enable row level security;

-- No anon grant on the table. The count comes back from the function, so
-- there is no query that returns a session id or an address.
grant all on public.page_views to service_role;
grant select, delete on public.page_views to authenticated;

drop policy if exists page_views_admin on public.page_views;
create policy page_views_admin
  on public.page_views for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.bump_views(p_session uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text := public.client_ip();
  fresh int;
begin
  if not exists (select 1 from public.page_views where session_id = p_session) then
    -- Twenty new sessions an hour from one address is already generous
    -- for a household or an office behind one CGNAT gateway, and it is
    -- the only thing standing between this number and a loop.
    if v_ip <> '' then
      select count(*) into fresh
      from public.page_views
      where ip = v_ip and created_at > now() - interval '1 hour';

      if fresh < 20 then
        insert into public.page_views (session_id, ip)
        values (p_session, v_ip)
        on conflict (session_id) do nothing;
      end if;
    else
      insert into public.page_views (session_id, ip)
      values (p_session, null)
      on conflict (session_id) do nothing;
    end if;
  end if;

  return (select count(*) from public.page_views);
end;
$$;

revoke all on function public.bump_views(uuid) from public;
grant execute on function public.bump_views(uuid) to anon, authenticated;
