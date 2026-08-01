import { useState } from 'react'
import { PlayIcon } from './primitives.jsx'

/* ── Image with placeholder fallback ───────────────
   Renders the real file when it exists; falls back to a
   labelled shell when it does not. Dropping a file in
   swaps it with no code change.

   Pass `slug` for project media (resolves to
   /work/<slug>/<src>), or `base` for anything else
   (certification badges use base="/certs"). */
export function ImagePlaceholder({
  slug,
  base,
  src,
  cap,
  alt,
  ratio = '16/9',
  fit = 'cover',
  showCaption = true,
  label,
  className = '',
}) {
  const [failed, setFailed] = useState(false)
  const dir = base ?? `/work/${slug}`
  const url = `${dir}/${src}`
  const caption = showCaption && cap ? <Caption>{cap}</Caption> : null

  if (failed) {
    return (
      <figure className={className} style={{ margin: 0 }}>
        <div className="ph-mizu" style={{ aspectRatio: ratio }}>
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
    <figure className={className} style={{ margin: 0 }}>
      <div className="ph-mizu" style={{ aspectRatio: ratio }}>
        <img
          src={url}
          alt={alt ?? cap ?? ''}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
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
export function YouTubePlaceholder({ id, cap, className = '' }) {
  const [failed, setFailed] = useState(false)
  const href = `https://www.youtube.com/watch?v=${id}`

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
      {cap && <Caption>{cap}</Caption>}
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
