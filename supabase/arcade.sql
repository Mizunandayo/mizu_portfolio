-- ══════════════════════════════════════════════════
-- 遊技場 — the arcade leaderboard.
--
-- One table for all four games rather than four
-- tables: the columns are identical, only the meaning
-- of `score` differs, and one throttle across the lot
-- is the behaviour we want anyway.
--
-- The client computes the score, so it can lie. That
-- cannot be prevented outright without running the game
-- on the server, which is not worth it for a portfolio
-- toy. What is worth it is refusing the impossible: a
-- reaction faster than a human nerve, a standing start
-- quicker than the animation allows. Bounds per game
-- below, enforced here rather than in the browser,
-- because the browser is the thing being doubted.
--
-- Names go through the same tidy_name() the tickets
-- use, so a blank or invisible-character name is
-- rejected in one place for the whole site.
-- ══════════════════════════════════════════════════

create table if not exists public.arcade_scores (
  id          uuid        primary key default gen_random_uuid(),
  game        text        not null check (game in ('boken', 'hebi', 'touge', 'shooter')),
  name        text        not null check (char_length(name) between 1 and 24),
  score       int         not null,
  visitor_key uuid        not null,
  ip          text,
  created_at  timestamptz not null default now()
);

-- The board reads "top N for one game", so the index is laid out the
-- way that query walks: game first, then score. Both directions are
-- served from it — Postgres can scan an index backwards.
-- For a table that already exists from an earlier run: the inline
-- check above only applies to a fresh install, so the constraint is
-- replaced here as well. Both paths end up with the same four games.
alter table public.arcade_scores drop constraint if exists arcade_scores_game_check;
alter table public.arcade_scores
  add constraint arcade_scores_game_check check (game in ('boken', 'hebi', 'touge', 'shooter'));

create index if not exists arcade_scores_board_idx
  on public.arcade_scores (game, score);

create index if not exists arcade_scores_ip_idx
  on public.arcade_scores (ip, created_at desc);

alter table public.arcade_scores enable row level security;

-- No anon grant at all: the table is reachable only through the two
-- functions below, which is what makes the throttle unskippable and
-- keeps visitor_key and ip unreadable.
grant all on public.arcade_scores to service_role;
grant select, insert, update, delete on public.arcade_scores to authenticated;

drop policy if exists arcade_scores_admin on public.arcade_scores;
create policy arcade_scores_admin
  on public.arcade_scores for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ── The board ─────────────────────────────────────
-- Ordering is decided here rather than by the caller, so a client
-- cannot ask for the board upside down and present the worst runs as
-- the best.
create or replace function public.arcade_board(p_game text, p_limit int default 10)
returns table (rank int, name text, score int, at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  -- All four games count up: metres and points. Written as a plain
  -- descending sort rather than a per-game case, because a case listing
  -- every game on one branch reads as though some game takes the other
  -- one and sends the next person hunting for which.
  --
  -- The ordering has to live inside the window as well as outside it.
  -- `over ()` with no order numbers the rows in whatever sequence they
  -- arrive, so the list came out sorted correctly with the wrong rank
  -- printed against each line — the worst kind of wrong, because it
  -- looks right until you read it.
  select row_number() over (
           order by -s.score,
                    s.created_at
         )::int,
         s.name,
         s.score,
         s.created_at
  from public.arcade_scores s
  where s.game = p_game
  order by
    -s.score,
    s.created_at
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.arcade_board(text, int) from public;
grant execute on function public.arcade_board(text, int) to anon, authenticated;


-- ── Submitting ────────────────────────────────────
create or replace function public.arcade_submit(
  p_game  text,
  p_name  text,
  p_score int,
  p_key   uuid
)
returns table (rank int, name text, score int, at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip     text := public.client_ip();
  v_name   text := public.tidy_name(p_name);
  /* Every game counts up. Named rather than inlined so that if a timed
     game is ever added back, this is the one line to change and the
     comparison below follows it. */
  v_higher boolean := true;
  v_lo     int;
  v_hi     int;
  recent   int;
  best     int;
begin
  -- What each game can possibly produce. Generous ceilings: the point is
  -- to refuse a number no run could reach, not to guess a good score.
  case p_game
    when 'boken'   then v_lo := 0;    v_hi := 100000;
    when 'hebi'    then v_lo := 0;    v_hi := 999999;
    when 'touge'  then v_lo := 0;     v_hi := 100000;
    when 'shooter' then v_lo := 0;    v_hi := 999999;
    else raise exception 'Unknown game.';
  end case;

  if p_score is null or p_score < v_lo or p_score > v_hi then
    raise exception 'That score is not possible.';
  end if;

  if v_name is null or v_name = '' then
    raise exception 'Enter a name first.';
  end if;

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

  -- One row per visitor per game, holding their best. A board listing
  -- the same person eight times is a worse board.
  select s.score into best
  from public.arcade_scores s
  where s.game = p_game and s.visitor_key = p_key;

  if best is null then
    insert into public.arcade_scores (game, name, score, visitor_key, ip)
    values (p_game, v_name, p_score, p_key, nullif(v_ip, ''));
  elsif (v_higher and p_score > best) or (not v_higher and p_score < best) then
    update public.arcade_scores
    set name = v_name, score = p_score, created_at = now(), ip = nullif(v_ip, '')
    where game = p_game and visitor_key = p_key;
  end if;

  return query select * from public.arcade_board(p_game, 10);
end;
$$;

revoke all on function public.arcade_submit(text, text, int, uuid) from public;
grant execute on function public.arcade_submit(text, text, int, uuid) to anon, authenticated;


-- ── Renaming ──────────────────────────────────────
-- Worth being precise about what a name change costs, because the
-- obvious guess is wrong: the boards key on the visitor, not on the
-- name, so changing it loses nothing at all.
--
-- What it would otherwise do is worse than losing a row — it splits one
-- player across two names. arcade_submit only writes `name` when you
-- beat your own score, so every board you do not go back and beat keeps
-- the old one, and the same person appears twice under different names
-- with no way to tell. This renames every row they own in one go.
create or replace function public.arcade_rename(p_name text, p_key uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := public.tidy_name(p_name);
  v_rows int;
begin
  if v_name is null or v_name = '' then
    raise exception 'Enter a name first.';
  end if;

  update public.arcade_scores
  set name = v_name
  where visitor_key = p_key;

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.arcade_rename(text, uuid) from public;
grant execute on function public.arcade_rename(text, uuid) to anon, authenticated;
