import { useCallback, useEffect, useRef, useState } from 'react'
import { configured } from '../../../data/supabase.js'
import {
  CABINETS, cabinet, board, beginRun, submit, forget, fmtScore, fmtParts, isBetter, readName, writeName,
} from '../../../data/arcade.js'
import Boken from './Boken.jsx'
import Hebi from './Hebi.jsx'
import Touge from './Touge.jsx'
import Shooter from './Shooter.jsx'
import Trophy from './Trophy.jsx'

/* ══════════════════════════════════════════════════
   遊技場 — the cabinet.

   Four games behind one frame: a picker, a stage, and
   the board beside it. The games know nothing about
   scoring or names; they run and hand back a number.
   Everything else lives here, so another cabinet is a
   component and a row in CABINETS.
   ══════════════════════════════════════════════════ */

const STAGE = { boken: Boken, hebi: Hebi, touge: Touge, shooter: Shooter }

const TOP = 10 // rows shown; the player's own row comes back regardless

export default function Arcade() {
  const [id, setId] = useState(CABINETS[0].id)
  const [rows, setRows] = useState([])
  const [name, setName] = useState(readName)
  const [draft, setDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [last, setLast] = useState(null)
  const [best, setBest] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState('ready')
  const playing = phase === 'run'
  const live = useRef(true)
  /* The open run, held as a promise rather than a value: a short game
     can finish before the server has answered, and awaiting it at submit
     time is what stops that losing the score. */
  const run = useRef(null)

  const c = cabinet(id)
  const Game = STAGE[id]

  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  const load = useCallback(async (game) => {
    try {
      const r = await board(game)
      if (live.current) setRows(r)
    } catch {
      if (live.current) setRows([])
    }
  }, [])

  /* Switching cabinet is a fresh start: the board, the last run and the
     session best all belong to one game. Phase included, or a game over
     on the way out stays painted over the next cabinet, which does not
     report its own state until you actually start it. */
  useEffect(() => {
    setRows([])
    setLast(null)
    setBest(null)
    setErr('')
    setPhase('ready')
    load(id)
  }, [id, load])

  /* The name is asked for once, before the first game, and every board
     uses it from then on. A form between the run and the leaderboard is
     the thing that stops people submitting at all, and it was asking
     again on every cabinet for a name it already had. */
  const named = name.trim().length > 0

  /* A run is opened the moment a game starts, so the server has its own
     clock on it. Without that the score is checked against nothing and
     any number submitted instantly would stand. */
  const onState = useCallback((p) => {
    setPhase(p)
    if (p !== 'run') return
    run.current = configured ? beginRun(id).catch(() => null) : null
  }, [id])

  const onScore = useCallback(
    async (score) => {
      setLast(score)
      setBest((b) => (isBetter(id, score, b) ? score : b))
      if (!configured || !name.trim()) return
      setBusy(true)
      setErr('')
      try {
        const token = await run.current
        run.current = null
        const r = await submit(id, name.trim(), score, token)
        if (live.current) setRows(r)
      } catch (e) {
        if (live.current) setErr(e.message || 'That run did not register.')
      } finally {
        if (live.current) setBusy(false)
      }
    },
    [id, name]
  )

  /* Naming and renaming are the same form. Naming is free; renaming
     clears every score this browser holds, which is why the panel says
     so plainly before the button is reachable. */
  const saveName = async (e) => {
    e.preventDefault()
    const v = draft.trim()
    if (!v || busy) return

    const first = !named
    writeName(v)
    setName(v)
    setRenaming(false)
    if (first || !configured) return

    /* A new name starts from nothing. The panel says so before you get
       here, so this is the confirmed action rather than a surprise. */
    setBusy(true)
    setErr('')
    setBest(null)
    try {
      await forget()
      if (live.current) await load(id)
    } catch (e2) {
      if (live.current) setErr(e2.message || 'Those scores could not be cleared.')
    } finally {
      if (live.current) setBusy(false)
    }
  }

  /* Space and the arrows scroll the page. While a run is going they
     belong to the game, whether or not the canvas kept focus — holding
     jump should not also take you to the bottom of the site. */
  useEffect(() => {
    if (!playing) return
    const keys = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])
    const swallow = (e) => {
      if (keys.has(e.code)) e.preventDefault()
    }
    window.addEventListener('keydown', swallow, { passive: false })
    return () => window.removeEventListener('keydown', swallow)
  }, [playing])

  return (
    <div className="ar-mizu">
      {/* ── Picker ── */}
      <div className="ar-tabs-mizu" role="tablist" aria-label="Arcade games">
        {CABINETS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={k.id === id}
            className={`ar-tab-mizu${k.id === id ? ' is-on' : ''}`}
            onClick={() => setId(k.id)}
          >
            <span className="ar-tab-jp-mizu" aria-hidden="true">{k.jp}</span>
            <span className="ar-tab-name-mizu">{k.name}</span>
          </button>
        ))}
      </div>

      <div className="ar-body-mizu">
        {/* ── Cabinet ── */}
        <div className="ar-stage-mizu">
          <div className="ar-cab-mizu">
            {/* The hood overhangs the sign and drops a shadow on it,
                which is what makes the marquee read as backlit rather
                than as a bright rectangle. Both inert. */}
            <div className="ar-hood-mizu">
              <span className="ar-tube-mizu" aria-hidden="true" />

              {/* A marquee names the game, so the name is on it. The
                  kanji and the title share a line at display size and
                  the strapline sits under them, quiet. */}
              <div className="ar-marquee-mizu">
                <p className="ar-marquee-row-mizu">
                  <span className="ar-marquee-jp-mizu" aria-hidden="true">{c.jp}</span>
                  <span className="ar-marquee-en-mizu">{c.name}</span>
                </p>
                <p className="ar-marquee-tag-mizu">{c.tag}</p>
              </div>
            </div>

            <div className="ar-bezel-mizu">
              <span className="ar-glare-mizu" aria-hidden="true" />
              <div className="ar-screen-mizu">
                <Game onScore={onScore} onState={onState} />

                {/* Every overlay here is inert, so the click that lands
                    on it still reaches the stage below — which is what
                    both focuses the canvas and starts the run. */}
                {named && !renaming && phase === 'ready' && (
                  <div className="ar-start-mizu">
                    <span className="ar-start-play-mizu" aria-hidden="true">▶</span>
                    <p className="ar-start-en-mizu">Press space to play</p>
                    <p className="ar-start-sub-mizu">or click the screen</p>
                  </div>
                )}

                {/* Over the game rather than replacing it, so the last
                    frame stays visible underneath — you get to see what
                    finished you. */}
                {phase === 'done' && !renaming && (
                  <div className="ar-over-mizu" aria-live="polite">
                    <p className="ar-over-jp-mizu" aria-hidden="true">終了</p>
                    <p className="ar-over-en-mizu">Game over</p>
                    {last != null && (
                      <p className="ar-over-score-mizu">{fmtScore(id, last)}</p>
                    )}
                    <p className="ar-over-sub-mizu">
                      {busy ? 'Sending to the board…'
                        : !configured ? 'The board is offline.'
                        : err ? err
                        : `On the board as ${name.trim()}`}
                    </p>
                  </div>
                )}

                {/* The gate, and the same panel again for a rename. Asked
                    once, then never again on any cabinet — this is what
                    the boards carry against every score. */}
                {(!named || renaming) && (
                  <div className="ar-gate-mizu">
                    <p className="ar-gate-jp-mizu" aria-hidden="true">名前</p>
                    <p className="ar-gate-en-mizu">
                      {renaming ? 'Change your name' : 'Pick a name to play'}
                    </p>
                    <p className="ar-gate-sub-mizu">
                      {renaming
                        ? 'This clears your scores on every board. The new name starts from nothing.'
                        : "Used for every cabinet's board."}
                    </p>
                    <form className="ar-gate-form-mizu" onSubmit={saveName}>
                      <input
                        className="ar-name-mizu"
                        value={draft}
                        maxLength={24}
                        placeholder="Your name"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label="Name for the leaderboards"
                      />
                      <button type="submit" className="ar-send-mizu" disabled={!draft.trim() || busy}>
                        {renaming ? 'Save name' : 'Start playing'}
                      </button>
                      {renaming && (
                        <button
                          type="button"
                          className="ar-cancel-mizu"
                          onClick={() => { setRenaming(false); setErr('') }}
                        >
                          Cancel
                        </button>
                      )}
                    </form>
                    {renaming && err && <p className="ar-gate-err-mizu">{err}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Sticks and buttons are furniture: they say what this is
                at a glance, and the real controls are the keyboard and
                the screen itself. */}
            <div className="ar-deck-mizu">
              <span className="ar-stick-mizu" aria-hidden="true"><i /></span>

              <span className="ar-keys-mizu">
                {c.keys.map((k) => (
                  <kbd key={k}>{k}</kbd>
                ))}
                <span>{c.how}</span>
              </span>

              <span className="ar-pads-mizu" aria-hidden="true">
                <i /><i /><i />
              </span>
            </div>

            <div className="ar-coin-mizu" aria-hidden="true">
              <span className="ar-slot-mizu" />
              <span className="ar-coin-word-mizu">Insert coin</span>
              <span className="ar-slot-mizu" />
            </div>
          </div>

          {named && !playing && !renaming && (
            <p className="ar-who-line-mizu">
              Playing as <b>{name.trim()}</b>
              <button
                type="button"
                className="ar-rename-mizu"
                onClick={() => { setDraft(name.trim()); setErr(''); setRenaming(true) }}
              >
                change
              </button>
              {best != null && <span> · best this session {fmtScore(id, best)}</span>}
            </p>
          )}
        </div>

        {/* ── Board ── */}
        <aside className="ar-board-mizu">
          <header className="ar-board-head-mizu">
            <span className="ar-board-jp-mizu" aria-hidden="true">順位</span>
            <h4 className="ar-board-title-mizu">Leaderboard</h4>
            {/* Which cabinet, and how deep the board goes. A count of
                the rows in hand would just read "10" forever now that
                only the top ten are fetched. */}
            <p className="ar-board-sub-mizu">
              {c.name}
              <b>Top {TOP}</b>
            </p>
          </header>

          {!configured ? (
            <p className="ar-board-empty-mizu">The board is offline.</p>
          ) : rows.length === 0 ? (
            <p className="ar-board-empty-mizu">
              Nobody has set a time yet. Go first.
            </p>
          ) : (
            <ol className="ar-board-list-mizu">
              {rows.filter((r) => r.rank <= TOP).map((r) => {
                const { value, unit } = fmtParts(id, r.score)

                /* The top three stack onto two lines. The panel is 260px
                   wide with 24px of padding, so a first-place name at
                   1.24rem and its score cannot share 212px beside a cup.
                   Fourth down keeps the compact row, which is also what
                   makes the break read as a podium rather than a glitch. */
                if (r.rank <= 3) {
                  return (
                    <li
                      key={`${r.rank}-${r.name}`}
                      className={`ar-pod-mizu is-${r.rank}${r.mine ? ' is-me' : ''}`}
                    >
                      <Trophy place={r.rank} />
                      <span className="ar-who-mizu">{r.name}</span>
                      <span className="ar-score-mizu">
                        {value}{unit && <i>{unit}</i>}
                      </span>
                    </li>
                  )
                }

                return (
                  <li
                    key={`${r.rank}-${r.name}`}
                    className={`ar-board-row-mizu${r.mine ? ' is-me' : ''}`}
                  >
                    <span className="ar-rank-mizu">{String(r.rank).padStart(2, '0')}</span>
                    <span className="ar-who-mizu">{r.name}</span>
                    <span className="ar-score-mizu">
                      {value}{unit && <i>{unit}</i>}
                    </span>
                  </li>
                )
              })}
            </ol>
          )}

          {/* Outside the list on purpose: the list scrolls and this must
              not scroll away. Only appears when the player did not make
              the ten, so it is never a duplicate of a row above. */}
          {rows.some((r) => r.rank > TOP) && (() => {
            const r = rows.find((x) => x.rank > TOP)
            const { value, unit } = fmtParts(id, r.score)
            return (
              <div className="ar-board-pin-mizu">
                <span className="ar-board-pin-cap-mizu">Your place</span>
                <p className="ar-board-row-mizu is-me">
                  <span className="ar-rank-mizu">{r.rank}</span>
                  <span className="ar-who-mizu">{r.name}</span>
                  <span className="ar-score-mizu">
                    {value}{unit && <i>{unit}</i>}
                  </span>
                </p>
              </div>
            )
          })()}
        </aside>
      </div>
    </div>
  )
}
