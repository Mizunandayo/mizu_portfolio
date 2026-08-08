import { useCallback, useEffect, useRef, useState } from 'react'
import { configured } from '../../../data/supabase.js'
import {
  CABINETS, cabinet, board, beginRun, submit, forget, nameTaken, NAME_MAX, fmtScore, fmtParts, isBetter, readName, writeName,
} from '../../../data/arcade.js'
import Boken from './Boken.jsx'
import Hebi from './Hebi.jsx'
import Touge from './Touge.jsx'
import Shooter from './Shooter.jsx'
import Trophy from './Trophy.jsx'
import useNameTaken from '../../../hooks/useNameTaken.jsx'

/* 遊技場 — four games behind one frame. The games know nothing about
   scoring or names; they run and hand back a number. */

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
  /* A promise, not a value: a short game can end before the server answers. */
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

  /* Phase included, or a game over stays painted over the next cabinet. */
  useEffect(() => {
    setRows([])
    setLast(null)
    setBest(null)
    setErr('')
    setPhase('ready')
    load(id)
  }, [id, load])

  const named = name.trim().length > 0

  const taken = useNameTaken(draft, nameTaken, {
    skip: (!renaming && named) || draft.trim() === name.trim(),
  })

  /* Opened on start so the server has its own clock on the run. */
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

  /* Renaming clears every score this browser holds; the panel says so. */
  const saveName = async (e) => {
    e.preventDefault()
    const v = draft.trim()
    if (!v || busy) return

    const first = !named
    writeName(v)
    setName(v)
    setRenaming(false)
    if (first || !configured) return

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


  /* While a run is going these belong to the game, focus or not. */
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
        <div className="ar-stage-mizu">
          <div className="ar-cab-mizu">
            {/* The hood's shadow is what makes the marquee read as backlit. */}
            <div className="ar-hood-mizu">
              <span className="ar-tube-mizu" aria-hidden="true" />

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

                {/* Inert, so the click reaches the stage and starts the run. */}
                {named && !renaming && phase === 'ready' && (
                  <div className="ar-start-mizu">
                    <span className="ar-start-play-mizu" aria-hidden="true">▶</span>
                    <p className="ar-start-en-mizu">Press space to play</p>
                    <p className="ar-start-sub-mizu">or click the screen</p>
                  </div>
                )}

                {/* Over the game, so you see what finished you. */}
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

                {/* The gate, and the same panel again for a rename. */}
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
                        maxLength={NAME_MAX}
                        placeholder="Your name"
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        aria-label="Name for the leaderboards"
                      />
                      <button
                        type="submit"
                        className="ar-send-mizu"
                        disabled={!draft.trim() || busy || taken === draft.trim() || taken === 'checking'}
                      >
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
                    <p className="ar-gate-note-mizu">
                      {taken === 'checking' ? 'Checking…'
                        : taken === draft.trim() ? `“${draft.trim()}” is already on the boards.`
                        : `${draft.trim().length}/${NAME_MAX}`}
                    </p>

                    {renaming && err && <p className="ar-gate-err-mizu">{err}</p>}
                  </div>
                )}
              </div>
            </div>

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

        <aside className="ar-board-mizu">
          <header className="ar-board-head-mizu">
            <span className="ar-board-jp-mizu" aria-hidden="true">順位</span>
            <h4 className="ar-board-title-mizu">Leaderboard</h4>
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

                /* Top three get the podium row; fourth down stays compact. */
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

          {/* Only when the player missed the ten, so never a duplicate. */}
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
