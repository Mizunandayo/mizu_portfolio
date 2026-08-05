import { useEffect, useState } from 'react'
import { configured } from '../../data/supabase.js'
import { subscribe } from '../../data/subscribers.js'
import { EMAIL_RE } from '../../data/tickets.js'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   瓦版 — kawaraban.

   Edo news came on single woodblock sheets, printed
   the day something happened and sold in the street by
   criers. A mailing list is the same object, so the
   section is one rather than a rounded card with a
   paper-plane icon on it.

   No container. The plate is the section and the type
   lies on it, which is how a printed sheet actually
   works: ink on the page, not a panel over a picture.
   ══════════════════════════════════════════════════ */

export default function Subscribe() {
  const [email, setEmail] = useState('')
  /* null while typing settles, then true/false. Same reason as the
     ticket's: a field should not shout "invalid" three characters in. */
  const [emailOk, setEmailOk] = useState(null)
  const [agree, setAgree] = useState(false)
  const [state, setState] = useState('idle')
  const [err, setErr] = useState('')

  useEffect(() => {
    const v = email.trim()
    if (!v) {
      setEmailOk(null)
      return
    }
    setEmailOk(null)
    const t = window.setTimeout(() => setEmailOk(EMAIL_RE.test(v)), 420)
    return () => clearTimeout(t)
  }, [email])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (state !== 'idle' || !emailOk || !agree) return
    setState('sending')
    setErr('')
    try {
      await subscribe(email)
      setState('done')
    } catch (e2) {
      setErr(e2.message || 'That did not go through. Try again.')
      setState('idle')
    }
  }

  if (!configured) return null

  return (
    <section id="subscribe" className="kw-mizu">
      <div className="kw-bg-mizu" aria-hidden="true" />

      <p className="kw-spine-mizu" aria-hidden="true">
        瓦版
      </p>

      <Reveal>
        <div className="kw-body-mizu">
          <p className="kw-kicker-mizu">瓦版 / Kawaraban</p>
          <h2 className="kw-title-mizu">KEEP UP WITH MIZU</h2>

          <p className="kw-lede-mizu">
            Subscribe to follow this portfolio and the engineering journey
            behind it. New projects as they ship, hackathon runs, fresh
            certifications, and the occasional rebuild of this page.
          </p>

          <p className="kw-note-mizu">
            瓦版 were the single sheets Edo criers sold whenever something
            actually happened. Same idea, fewer woodblocks. No schedule and no
            filler.
          </p>

          {state === 'done' ? (
            <div className="kw-done-mizu" role="status">
              <span className="kw-seal-mizu" aria-hidden="true">
                封
              </span>
              <div>
                <p className="kw-done-head-mizu">Check your inbox.</p>
                <p className="kw-done-sub-mizu">
                  If that address is not on the list already, a confirmation
                  link is on its way. One click and you are set.
                </p>
              </div>
            </div>
          ) : (
            <form className="kw-form-mizu" onSubmit={onSubmit} noValidate>
              <label className="kw-field-mizu">
                <span className="kw-label-mizu">メール / Email</span>
                <input
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  /* Consent belongs to the address on screen, so editing it
                     withdraws the tick rather than carrying it over. */
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setAgree(false)
                    if (err) setErr('')
                  }}
                  aria-invalid={emailOk === false}
                />
              </label>

              {/* Kept mounted so it can animate out. The 0fr/1fr grid row
                  transitions the height without hardcoding one. */}
              <div className={`kw-consent-mizu${emailOk ? ' is-on' : ''}`}>
                <div>
                  <label className="kw-check-mizu">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      tabIndex={emailOk ? 0 : -1}
                    />
                    <span>
                      Send updates about this portfolio to this address.
                      I will get one email to confirm it is mine, and can
                      reply to any of them to be taken off the list.
                    </span>
                  </label>
                </div>
              </div>

              <div className="kw-act-mizu">
                <button
                  type="submit"
                  className="kw-send-mizu"
                  disabled={state === 'sending' || !emailOk || !agree}
                >
                  {state === 'sending' ? 'Sending…' : '購読 Subscribe'}
                </button>
              </div>

              {(err || emailOk === false) && (
                <p className="kw-hint-mizu" role="alert" aria-live="polite">
                  {err || 'That does not look like an email address.'}
                </p>
              )}
            </form>
          )}
        </div>
      </Reveal>
    </section>
  )
}
