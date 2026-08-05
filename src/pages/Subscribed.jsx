import { useLocation, Link } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import { metaFor } from '../seo.js'

/* Where confirm-subscribe lands people. The function does the write and
   redirects here with the outcome, because an Edge Function cannot serve
   a page: everything it returns is text/plain with nosniff, so a browser
   will not render it whatever Content-Type it sets. */

const STATES = {
  confirmed: {
    seal: '済',
    head: 'You are on the sheet',
    body: 'That is it. Nothing arrives until there is something worth printing, and you can reply to any of it to come off the list.',
  },
  already: {
    seal: '済',
    head: 'You are already on the list',
    body: 'This link was used once already, which is all it takes. Nothing else is needed.',
  },
  unsubscribed: {
    seal: '止',
    head: 'You are off the list',
    body: 'No more updates will be sent to that address. Nothing else of yours was touched, and you can subscribe again any time.',
  },
  expired: {
    seal: '期',
    head: 'That link has expired',
    body: 'It was probably replaced by a newer one. Subscribe again and a fresh link will arrive.',
  },
  invalid: {
    seal: '？',
    head: 'That link is not valid',
    body: 'Check the whole address was copied across. If it keeps failing, subscribe again and a fresh link will arrive.',
  },
  error: {
    seal: '！',
    head: 'Something went wrong',
    body: 'The link could not be checked just now. Try it again in a moment.',
  },
}

export default function Subscribed() {
  const { search } = useLocation()
  const key = new URLSearchParams(search).get('s') ?? 'error'
  const s = STATES[key] ?? STATES.error
  const good = key === 'confirmed' || key === 'already'

  return (
    <>
      <Seo {...metaFor('/subscribed')} />
      <main className="kwd-mizu" id="main">
        <div className="kwd-bg-mizu" aria-hidden="true" />

        <div className="kwd-body-mizu">
          <p className="kwd-kicker-mizu">瓦版 / Kawaraban</p>

          <div className="kwd-row-mizu">
            <span
              className={`kw-seal-mizu${good ? '' : ' is-flat'}`}
              aria-hidden="true"
            >
              {s.seal}
            </span>
            <h1 className="kwd-head-mizu">{s.head}</h1>
          </div>

          <p className="kwd-copy-mizu">{s.body}</p>

          <Link className="kwd-back-mizu" to="/">
            戻る Back to the portfolio
          </Link>
        </div>
      </main>
    </>
  )
}
