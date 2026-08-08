-- 遊技場 — the arcade leaderboard. One table for all four games.
--
-- The score is a number the browser chose and nothing here can make it
-- true; what these do is make a fake score cost what a real one costs.
-- Ceilings are read off what each game can emit, a run must be opened
-- before it can be scored and the server's clock has to allow it, and
-- opening, scoring and clearing are all rate limited per address.
-- No anon grants on either table; every function pins search_path.

-- ── Tables ────────────────────────────────────────

create table if not exists public.arcade_scores (
  id          uuid        primary key default gen_random_uuid(),
  game        text        not null check (game in ('boken', 'hebi', 'touge', 'shooter')),
  name        text        not null check (char_length(name) between 1 and 24),
  score       int         not null check (score >= 0),
  visitor_key uuid        not null,
  ip          text,
  created_at  timestamptz not null default now()
);

alter table public.arcade_scores drop constraint if exists arcade_scores_game_check;
alter table public.arcade_scores
  add constraint arcade_scores_game_check check (game in ('boken', 'hebi', 'touge', 'shooter'));

-- An open run: proof that wall-clock time passed before the score.
create table if not exists public.arcade_runs (
  id          uuid        primary key default gen_random_uuid(),
  game        text        not null check (game in ('boken', 'hebi', 'touge', 'shooter')),
  visitor_key uuid        not null,
  ip          text,
  started_at  timestamptz not null default now(),
  spent       boolean     not null default false
);

create index if not exists arcade_scores_board_idx
  on public.arcade_scores (game, score);

-- Submitting looks its own row up on every call; without this that is a
-- sequential scan anyone can trigger at will.
create index if not exists arcade_scores_mine_idx
  on public.arcade_scores (game, visitor_key);

create index if not exists arcade_scores_ip_idx
  on public.arcade_scores (ip, created_at desc);

create index if not exists arcade_runs_ip_idx
  on public.arcade_runs (ip, started_at desc);

alter table public.arcade_scores enable row level security;
alter table public.arcade_runs   enable row level security;

grant all on public.arcade_scores to service_role;
grant all on public.arcade_runs   to service_role;
grant select, insert, update, delete on public.arcade_scores to authenticated;

drop policy if exists arcade_scores_admin on public.arcade_scores;
create policy arcade_scores_admin
  on public.arcade_scores for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No policy on arcade_runs: only the definer functions reach it, so a
-- token cannot be harvested.


-- ── What each game can actually produce ───────────
-- Read off the game code: boken 16.3 m/s, hebi 7,220 on a perfect
-- 308-cell board, touge 620 m/s with nitro, shooter 200 pts/s.
-- `rate` is checked against elapsed time, `hi` is the flat refusal.
drop function if exists public.arcade_limits(text);
create or replace function public.arcade_limits(p_game text)
returns table (lo int, hi int, rate numeric)
language sql
immutable
as $$
  select t.lo, t.hi, t.rate
  from (values
    ('boken',   0,  20000,  17.0),
    ('hebi',    0,   7300, 120.0),
    ('touge',   0, 200000, 650.0),
    ('shooter', 0, 200000, 200.0)
  ) t(g, lo, hi, rate)
  where t.g = p_game;
$$;


-- ── Opening a run ─────────────────────────────────
drop function if exists public.arcade_begin(text, uuid);
create or replace function public.arcade_begin(p_game text, p_key uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip   text := public.client_ip();
  v_open int;
  v_id   uuid;
begin
  if not exists (select 1 from public.arcade_limits(p_game)) then
    raise exception 'Unknown game.';
  end if;

  delete from public.arcade_runs where started_at < now() - interval '1 hour';

  if v_ip <> '' then
    select count(*) into v_open
    from public.arcade_runs
    where ip = v_ip and started_at > now() - interval '1 hour';

    if v_open >= 200 then
      raise exception 'That is a lot of games from here. Try again later.';
    end if;
  end if;

  insert into public.arcade_runs (game, visitor_key, ip)
  values (p_game, p_key, nullif(v_ip, ''))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.arcade_begin(text, uuid) from public;
grant execute on function public.arcade_begin(text, uuid) to anon, authenticated;


-- ── The board ─────────────────────────────────────
drop function if exists public.arcade_submit(text, text, int, uuid);
drop function if exists public.arcade_submit(text, text, int, uuid, uuid);
drop function if exists public.arcade_board(text, int);
drop function if exists public.arcade_board(text, int, uuid);
drop function if exists public.arcade_rename(text, uuid);

create or replace function public.arcade_board(
  p_game  text,
  p_limit int  default 10,
  p_key   uuid default null
)
returns table (rank int, name text, score int, at timestamptz, mine boolean)
language sql
security definer
stable
set search_path = public
as $$
  -- The ordering has to live inside the window as well as outside it:
  -- `over ()` with no order numbers rows in arrival order, which sorts
  -- the list correctly and prints the wrong rank against each line.
  --
  -- The caller's own row comes back whether or not it made the cut.
  with ranked as (
    select row_number() over (order by -s.score, s.created_at)::int as rank,
           s.name,
           s.score,
           s.created_at as at,
           s.visitor_key
    from public.arcade_scores s
    where s.game = p_game
  ),
  lim as (select greatest(1, least(coalesce(p_limit, 10), 50)) as n)
  -- coalesce because `uuid = null` is null, not false.
  select r.rank, r.name, r.score, r.at, coalesce(r.visitor_key = p_key, false) as mine
  from ranked r, lim
  where r.rank <= lim.n
     or (p_key is not null and r.visitor_key = p_key)
  order by r.rank;
$$;

revoke all on function public.arcade_board(text, int, uuid) from public;
grant execute on function public.arcade_board(text, int, uuid) to anon, authenticated;


-- ── Is that name taken ────────────────────────────
-- Case-insensitive. Your own rows are excluded, or the rename panel
-- would refuse the name you already hold.
drop function if exists public.arcade_name_taken(text, uuid);
create or replace function public.arcade_name_taken(p_name text, p_key uuid default null)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.arcade_scores
    where lower(name) = lower(public.tidy_name(p_name))
      and (p_key is null or visitor_key <> p_key)
  );
$$;

revoke all on function public.arcade_name_taken(text, uuid) from public;
grant execute on function public.arcade_name_taken(text, uuid) to anon, authenticated;


-- ── Scoring a run ─────────────────────────────────
create or replace function public.arcade_submit(
  p_game  text,
  p_name  text,
  p_score int,
  p_key   uuid,
  p_run   uuid
)
returns table (rank int, name text, score int, at timestamptz, mine boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip      text := public.client_ip();
  v_name    text := public.tidy_name(p_name);
  v_lo      int;
  v_hi      int;
  v_rate    numeric;
  v_started timestamptz;
  v_secs    numeric;
  recent    int;
  best      int;
begin
  select l.lo, l.hi, l.rate into v_lo, v_hi, v_rate
  from public.arcade_limits(p_game) l;

  if v_rate is null then
    raise exception 'Unknown game.';
  end if;

  if p_score is null or p_score < v_lo or p_score > v_hi then
    raise exception 'That score is not possible.';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'Enter a name first.';
  end if;
  v_name := left(v_name, 15); -- the gate caps at 15; this is the backstop

  if v_ip <> '' then
    select count(*) into recent
    from public.arcade_scores
    where arcade_scores.ip = v_ip
      and created_at > now() - interval '1 hour';

    if recent >= 60 then
      raise exception 'That is a lot of runs from here. Try again later.';
    end if;
  end if;

  -- Claimed with an UPDATE, not a SELECT: two calls racing the same run
  -- cannot both flip `spent`, and the loser sees no row.
  update public.arcade_runs
  set spent = true
  where id = p_run
    and game = p_game
    and visitor_key = p_key
    and not spent
    and started_at > now() - interval '1 hour'
  returning started_at into v_started;

  if v_started is null then
    raise exception 'That run has already been scored.';
  end if;

  -- Five seconds of slack for clock skew; beyond that the score has to
  -- be reachable at the game's own top speed.
  v_secs := extract(epoch from (now() - v_started));
  if p_score > v_rate * (v_secs + 5) then
    raise exception 'That run was too quick for that score.';
  end if;

  select s.score into best
  from public.arcade_scores s
  where s.game = p_game and s.visitor_key = p_key;

  if best is null then
    insert into public.arcade_scores (game, name, score, visitor_key, ip)
    values (p_game, v_name, p_score, p_key, nullif(v_ip, ''));
  elsif p_score > best then
    update public.arcade_scores
    set name = v_name, score = p_score, created_at = now(), ip = nullif(v_ip, '')
    where game = p_game and visitor_key = p_key;
  end if;

  return query select * from public.arcade_board(p_game, 10, p_key);
end;
$$;

revoke all on function public.arcade_submit(text, text, int, uuid, uuid) from public;
grant execute on function public.arcade_submit(text, text, int, uuid, uuid) to anon, authenticated;


-- ── Starting over ─────────────────────────────────
-- Changing your name clears your scores: a name here is meant to be the
-- name that earned the run. Only touches rows for the key it is handed.
drop function if exists public.arcade_forget(uuid);
create or replace function public.arcade_forget(p_key uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip   text := public.client_ip();
  recent int;
  v_rows int;
begin
  if v_ip <> '' then
    select count(*) into recent
    from public.arcade_runs
    where ip = v_ip and started_at > now() - interval '1 hour';

    if recent >= 200 then
      raise exception 'Try again later.';
    end if;
  end if;

  delete from public.arcade_scores where visitor_key = p_key;
  get diagnostics v_rows = row_count;

  delete from public.arcade_runs where visitor_key = p_key;

  return v_rows;
end;
$$;

revoke all on function public.arcade_forget(uuid) from public;
grant execute on function public.arcade_forget(uuid) to anon, authenticated;
