/* ══════════════════════════════════════════════════
   The email, as a surface you can type into.

   One component for writing and for reading a sent
   one, because a preview that is a separate rendering
   of the same data is a preview that drifts. Here the
   fields sit inside the layout they will be sent in,
   so what is on screen is the thing.

   The measurements mirror the mail template in
   send-update: 600px, #0d0d0f, the same type ramp.
   They have to be changed together.
   ══════════════════════════════════════════════════ */

export default function EmailSheet({
  banner, heading, body, ctaLabel,
  onHeading, onBody, onCta, onPickFile,
  site = 'your site',
}) {
  const live = Boolean(onHeading)

  return (
    <div className="es-mizu">
      {/* A label wrapping a hidden input: the banner itself is the
          control, with no button-triggers-input plumbing and no fight
          with the browser's own widget. */}
      {live ? (
        <label className="es-banner-mizu is-live">
          <input
            type="file" accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0]
              /* Cleared so choosing the same file twice fires again,
                 which it otherwise would not. */
              e.target.value = ''
              if (f) onPickFile(f)
            }}
          />
          {banner ? <img src={banner} alt="" /> : <span>No banner set</span>}
          <span className="es-swap-mizu">
            <strong>Change banner</strong>
            Upload and reposition
          </span>
        </label>
      ) : (
        <div className="es-banner-mizu">
          {banner ? <img src={banner} alt="" /> : <span>No banner set</span>}
        </div>
      )}

      <div className="es-pad-mizu">
        <p className="es-kicker-mizu">瓦版 &nbsp;/&nbsp; Kawaraban</p>

        {live ? (
          <input
            className="es-head-mizu"
            value={heading}
            maxLength={120}
            placeholder="I shipped something new"
            onChange={(e) => onHeading(e.target.value)}
            aria-label="Heading in the email"
          />
        ) : (
          <h3 className="es-head-mizu">{heading}</h3>
        )}

        {live ? (
          <textarea
            className="es-body-mizu"
            value={body}
            rows={7}
            maxLength={4000}
            placeholder={'What changed, and why it is worth a look.\n\nA blank line starts a new paragraph.'}
            onChange={(e) => onBody(e.target.value)}
            aria-label="Message"
          />
        ) : (
          <div className="es-body-mizu is-read">
            {String(body).split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {/* Empty label means no button at all, in the composer and in the
            sent mail alike, so the absence is visible rather than implied. */}
        {live ? (
          <div className="es-ctarow-mizu">
            <input
              className="es-cta-mizu"
              value={ctaLabel}
              maxLength={40}
              placeholder="Button label"
              onChange={(e) => onCta(e.target.value)}
              aria-label="Button label"
              size={Math.max(12, ctaLabel.length || 12)}
            />
            {!ctaLabel && <span className="es-nocta-mizu">No button</span>}
          </div>
        ) : (
          ctaLabel && <span className="es-cta-mizu is-read">{ctaLabel}</span>
        )}

        <div className="es-rule-mizu" />

        <p className="es-sign-mizu">
          Francis Daniel Genese
          <br />
          <span>{site}</span>
        </p>
        <p className="es-fine-mizu">
          You are getting this because you subscribed to updates from this
          portfolio. <u>Unsubscribe</u>.
        </p>
      </div>
    </div>
  )
}
