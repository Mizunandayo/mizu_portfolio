import { useState, useEffect, useMemo } from 'react'
import { PlayIcon } from './primitives.jsx'

/* Formats tried, in order, when the declared file is not there. Lets a
   folder hold `cover.jpg` while the data says `cover.png` — the loader
   walks the list before giving up and showing a placeholder. */
const FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif']

export function candidatesFor(url) {
  const m = url.match(/^(.*)\.([A-Za-z0-9]+)$/)
  if (!m) return [url]
  const [, stem, ext] = m
  const others = FORMATS.filter((f) => f !== ext.toLowerCase())
  return [url, ...others.map((f) => `${stem}.${f}`)]
}

/* ── Image with placeholder fallback ───────────────
   Renders the real file when it exists; falls back to a
   labelled shell when it does not. Dropping a file in
   swaps it with no code change.

   Pass `slug` for project media (resolves to
   /work/<slug>/<src>), or `base` for anything else
   (certification badges use base="/certs"). */
export function ImagePlaceholder({
  /* A already-resolved URL — used by build-time-discovered media, where
     the file is known to exist so no format probing is needed. */
  url: resolvedUrl,
  slug,
  base,
  src,
  cap,
  alt,
  ratio = '16/9',
  fit = 'cover',
  showCaption = true,
  label,
  /* Fill the parent instead of holding a ratio — for full-bleed slots
     where the container decides the height. */
  fill = false,
  className = '',
}) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const dir = base ?? `/work/${slug}`
  const url = resolvedUrl ?? `${dir}/${src}`
  const caption = showCaption && cap ? <Caption>{cap}</Caption> : null

  /* A resolved URL skips the format walk — it came from the build, so
     it is the only candidate that can be right. */
  const candidates = useMemo(
    () => (resolvedUrl ? [resolvedUrl] : candidatesFor(url)),
    [resolvedUrl, url]
  )
  const current = candidates[attempt] ?? url

  /* Reset when the source changes. React reuses this instance when only
     `src` changes — as the gallery stage does when stepping through
     images — so without this, one missing file latches `failed` on and
     every later image renders as a placeholder too. */
  useEffect(() => {
    setFailed(false)
    setAttempt(0)
  }, [url])

  /* Try the next format before declaring the file missing. */
  const onError = () => {
    if (attempt < candidates.length - 1) setAttempt(attempt + 1)
    else setFailed(true)
  }
  const frame = fill ? { height: '100%' } : { aspectRatio: ratio }
  const figureStyle = fill ? { margin: 0, height: '100%' } : { margin: 0 }

  if (failed) {
    return (
      <figure className={className} style={figureStyle}>
        <div className="ph-mizu" style={frame}>
          <span className="ph-label-mizu">
            {label ?? (
              <>
                {ratio.replace('/', ':')}
                <br />
                {cap}
              </>
            )}
          </span>
        </div>
        {caption}
      </figure>
    )
  }

  return (
    <figure className={className} style={figureStyle}>
      <div className="ph-mizu" style={frame}>
        <img
          /* Keyed on the candidate so a format fallback swaps the
             element rather than mutating a src the browser has already
             marked as failed. */
          key={current}
          src={current}
          alt={alt ?? cap ?? ''}
          loading="lazy"
          decoding="async"
          onError={onError}
          style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
        />
      </div>
      {caption}
    </figure>
  )
}

/* ── YouTube facade ────────────────────────────────
   Thumbnail + play affordance linking to the video.
   No iframe, so no third-party script on first paint. */
/* `cap` still describes the video to a screen reader and still labels
   the fallback tile when the thumbnail 404s — `showCaption` governs the
   printed figcaption alone, so hiding it costs nothing in meaning. */
export function YouTubePlaceholder({ id, cap, showCaption = true, className = '' }) {
  const [failed, setFailed] = useState(false)
  const href = `https://www.youtube.com/watch?v=${id}`

  /* Same reset as ImagePlaceholder — the instance is reused when only
     `id` changes. */
  useEffect(() => { setFailed(false) }, [id])

  return (
    <figure className={className} style={{ margin: 0 }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${cap} — opens YouTube in a new tab`}
        style={{ display: 'block', textDecoration: 'none' }}
      >
        <div className="ph-mizu" style={{ aspectRatio: '16/9', position: 'relative' }}>
          {!failed && (
            <img
              src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', opacity: 0.62,
              }}
            />
          )}
          {failed && <span className="ph-label-mizu">16:9<br />{cap}</span>}

          <span
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: 54, height: 54, borderRadius: '50%',
                background: 'rgba(250,250,250,0.94)', color: '#050505',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingLeft: 3,
                boxShadow: '0 6px 28px rgba(0,0,0,0.5)',
              }}
            >
              <PlayIcon width="16" height="16" />
            </span>
          </span>
        </div>
      </a>
      {cap && showCaption && <Caption>{cap}</Caption>}
    </figure>
  )
}

function Caption({ children }) {
  return (
    <figcaption
      style={{
        marginTop: 10,
        fontSize: '0.78rem',
        color: 'rgba(161,161,170,0.9)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </figcaption>
  )
}
