-- ══════════════════════════════════════════════════
-- 遊技場 — the arcade leaderboard.
--
-- One table for all four games rather than four: the
-- columns are identical, only the meaning of `score`
-- differs, and one throttle across the lot is the
-- behaviour we want anyway.
--
-- ── What can and cannot be defended ──
--
-- The game runs in the browser, so the score is a number
-- the browser chose. Nothing here can make that number
-- true. Running the games server-side would, and is not
-- worth it for a portfolio toy.
--
-- What is worth it is making a fake score cost the same
-- as a real one. Three layers, in order of how much they
-- actually buy:
--
--   1. Ceilings that match what the code can emit. Snake
--      cannot exceed 7,220 because the board holds 308
--      cells; the old ceiling of 999,999 let a forged
--      score sit at the top forever and look plausible.
--
--   2. A run has to be opened before it can be scored,
--      and the elapsed wall-clock time has to be enough
--      for the score at the game's own top speed. To put
--      up 3,000m in Boken you must wait the 184 seconds
--      the run would really take. Tokens are single use,
--      so a run cannot be replayed.
--
--   3. Rate limits per address on opening runs, scoring
--      them, and clearing your own scores.
--
-- Together these do not make cheating impossible. They
-- make it slower than playing, which for a board of this
-- size is the win condition.
--
-- ── What is properly locked ──
--
-- No anon grants on either table. Everything goes through
-- the functions below, so the throttles cannot be walked
-- around and visitor_key and ip are never readable by
-- anyone. Every function pins `search_path`, so a planted
-- function in another schema cannot be picked up by an
-- unqualified call inside a definer body.
--
-- Names go through the same tidy_name() the tickets use,
-- so blanks, control characters and zero-width padding
-- are rejected in one place for the whole site.
-- ══════════════════════════════════════════════════

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

-- The inline check only applies to a fresh install, so it is replaced
-- here too. Both paths end up with the same four games.
alter table public.arcade_scores drop constraint if exists arcade_scores_game_check;
alter table public.arcade_scores
  add constraint arcade_scores_game_check check (game in ('boken', 'hebi', 'touge', 'shooter'));

-- An open run, waiting to be scored. Its whole job is to prove that
-- wall-clock time passed between starting and submitting.
create table if not exists public.arcade_runs (
  id          uuid        primary key default gen_random_uuid(),
  game        text        not null check (game in ('boken', 'hebi', 'touge', 'shooter')),
  visitor_key uuid        not null,
  ip          text,
  started_at  timestamptz not null default now(),
  spent       boolean     not null default false
);

-- The board reads "top N for one game", so the index is laid out the way
-- that query walks. Both directions are served from it — Postgres can
-- scan an index backwards.
create index if not exists arcade_scores_board_idx
  on public.arcade_scores (game, score);

-- Submitting looks its own row up by game and key on every single call.
-- Without this that is a sequential scan, which is a slow query anyone
-- can trigger at will — a rate limiter that costs the server more than
-- it costs the attacker is not a rate limiter.
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

-- No policy at all on arcade_runs: with RLS on and nothing granted, it
-- is reachable only from the definer functions below. Nobody gets to
-- read open runs, which is what stops a token being harvested.


-- ── What each game can actually produce ───────────
-- Read off the game code, not guessed.
--
--   boken   320px/s x 1.25 board x 1.22 nudge = 488px/s over 30px/m
--           = 16.3 m/s. 20,000m would be twenty minutes unbroken.
--   hebi    a 22x14 board is 308 cells and the snake starts at 4 and
--           grows 2 an apple, so 152 apples is a perfect game and the
--           scoring curve makes that 7,220. It cannot go higher.
--   touge   (430 + 190 nitro) x 40 units/s over 40 = 620 m/s.
--   shooter one spawn per 300ms at 60pts for the best kill = 200 pts/s
--           with nothing missed.
--
-- `rate` is the per-second ceiling checked against elapsed time; `hi` is
-- the absolute refusal. Both are deliberately a little generous — the
-- point is to refuse the impossible, not to adjudicate a good run.
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
-- Called when a game actually starts. Returns a token the submit below
-- will demand. The token is worthless on its own: it carries no score
-- and cannot be read back out of the table.
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

  -- Housekeeping on the way past, so nothing has to be scheduled. An
  -- hour is far longer than any run and short enough that the table
  -- stays small.
  delete from public.arcade_runs where started_at < now() - interval '1 hour';

  -- Opening runs is cheap for the caller, so it needs its own ceiling or
  -- it is a free way to make the server write rows all day.
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
-- Ordering is decided here rather than by the caller, so a client cannot
-- ask for the board upside down and present the worst runs as the best.
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
  -- All four games count up: metres and points. Written as a plain
  -- descending sort rather than a per-game case, because a case listing
  -- every game on one branch reads as though some game takes the other.
  --
  -- The ordering has to live inside the window as well as outside it.
  -- `over ()` with no order numbers rows in whatever sequence they
  -- arrive, so the list came out sorted correctly with the wrong rank
  -- against each line — the worst kind of wrong, because it looks right
  -- until you read it.
  --
  -- The caller's own row comes back whether or not it made the cut, so
  -- somebody sitting at 31st can still see where they are. It is ranked
  -- against the whole board, not against the rows returned.
  --
  -- `mine` is computed here and the key itself is never returned, so a
  -- client can highlight its own row without the board ever handing out
  -- anybody's identifier.
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
  -- Wrapped in coalesce because `uuid = null` is null, not false. The
  -- site always sends a key so it never saw this, but calling the board
  -- by hand without one printed a column of NULLs where a plain false
  -- is what is meant.
  select r.rank, r.name, r.score, r.at, coalesce(r.visitor_key = p_key, false) as mine
  from ranked r, lim
  where r.rank <= lim.n
     or (p_key is not null and r.visitor_key = p_key)
  order by r.rank;
$$;

revoke all on function public.arcade_board(text, int, uuid) from public;
grant execute on function public.arcade_board(text, int, uuid) to anon, authenticated;


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
  v_name := left(v_name, 24);

  -- Per address, per hour. Generous enough that nobody playing honestly
  -- will meet it, tight enough that a script cannot fill the board.
  if v_ip <> '' then
    select count(*) into recent
    from public.arcade_scores
    where arcade_scores.ip = v_ip
      and created_at > now() - interval '1 hour';

    if recent >= 60 then
      raise exception 'That is a lot of runs from here. Try again later.';
    end if;
  end if;

  -- Spend the token. Claimed with an UPDATE rather than checked with a
  -- SELECT so two calls racing the same run cannot both win it: only one
  -- update can flip `spent`, and the loser sees no row.
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

  -- Time has to have passed for the score to exist. The five seconds of
  -- slack absorbs clock skew and the moment between the game starting
  -- and the row being written; beyond that a score has to be earned at
  -- a speed the game can actually reach.
  v_secs := extract(epoch from (now() - v_started));
  if p_score > v_rate * (v_secs + 5) then
    raise exception 'That run was too quick for that score.';
  end if;

  -- One row per visitor per game, holding their best. A board listing
  -- the same person eight times is a worse board.
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
-- Changing your name clears your scores. Worth spelling out, because it
-- is a deliberate choice and not the only one available: the boards key
-- on the visitor rather than on the name, so a rename could equally have
-- carried every entry across untouched.
--
-- It works this way because a name on this board is meant to be the name
-- that earned the run. Carrying a score onto a new name lets one person
-- hold a place under a name that never played for it, and nobody reading
-- the board could tell. A clean slate is the honest version, and it is
-- why the client warns before calling this.
--
-- It only ever deletes rows belonging to the key it is handed, and keys
-- are never returned by anything here, so it cannot be pointed at
-- somebody else's scores without first guessing a UUID.
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
  -- A destructive endpoint open to anonymous callers needs its own
  -- ceiling, even though it can only ever reach rows the caller already
  -- holds the key for.
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
