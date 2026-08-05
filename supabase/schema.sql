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

-- Confirm the header name for your project before trusting the numbers.
create or replace function public.tickets_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ip text := split_part(
    coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
    ',', 1);
  recent int;
  wait_min int;
begin
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
