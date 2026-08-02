import { CERTS_ORDERED, CERT_COUNT, CERT_ISSUERS } from '../../data/certifications.js'
import { PROFILE } from '../../data/profile.js'
import { Pill, CredlyIcon, ExternalIcon } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

/* ══════════════════════════════════════════════════
   Certifications — laid out as a manga page.

   Built without SectionShell, the same way About is:
   the title block is a composition of its own (logo
   type over kana over a saw strip) and would fight
   the shell's eyebrow/claim/copy stack.

   Each credential is drawn as an ofuda — the pointed
   paper talisman sold at shrines: notched head, ink
   border, vertical kanji down one edge and a stamped
   seal in the corner. Every one is the same size, the
   way a rack of real talismans is.
   ══════════════════════════════════════════════════ */

export default function Certifications() {
  return (
    <section id="certifications" className="mg-page-mizu">
      <div className="mg-sheet-mizu">
        <span className="mg-saw-mizu" aria-hidden="true" />

        <header className="mg-head-mizu">
          {/* Radial speed lines sit behind the type, masked so they
              fade out before they reach the panels. */}
          <span className="mg-burst-mizu" aria-hidden="true" />

          <p className="mg-kicker-mizu">Certifications</p>
          <h2 className="mg-title-mizu">CERTIFIED</h2>
          <p className="mg-kana-mizu" aria-hidden="true">認定証</p>
        </header>

        <Reveal>
          <p className="mg-lede-mizu">
            {CERT_COUNT} certifications across {CERT_ISSUERS.length} issuers, newest
            first. Credential IDs are listed in full — there is no résumé PDF to go
            looking in.
          </p>
        </Reveal>

        <div className="mg-grid-mizu">
          {CERTS_ORDERED.map((c, i) => (
            /* h-full on the Reveal wrapper, not the panel: Reveal
               renders the element that actually becomes the grid item,
               so sizing the panel inside would leave the item short and
               the talismans would stop matching. */
            <Reveal key={c.id} delay={Math.min((i % 4) + 1, 6)} className="h-full">
              <Panel cert={c} index={i} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <footer className="mg-credits-mizu">
            <p className="mg-credit-line-mizu">
              Issued by {CERT_ISSUERS.join(' · ')}
            </p>
            <p className="mg-credit-line-mizu">
              Every badge verifiable on Credly
            </p>

            <Pill href={PROFILE.contact.credly} external>
              <CredlyIcon />
              View Credly profile
              <ExternalIcon />
            </Pill>

            <p className="mg-folio-mizu" aria-hidden="true">
              全{CERT_COUNT}枚
            </p>
          </footer>
        </Reveal>
      </div>
    </section>
  )
}

function Panel({ cert: c, index }) {
  return (
    /* Two nested boxes carrying the same notched clip: the outer is the
       ink, the inner is the paper inset by the border width. A plain
       border cannot follow a clip-path — it gets cut off with the
       corners it is meant to draw. */
    <article className="mg-fuda-mizu">
      <div className="mg-fuda-body-mizu">
        <div className="mg-fuda-head-mizu">
          <span className="mg-fuda-no-mizu" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Screentone only on the art cell, so the caption stays clean
            the way lettering does on a real page. */}
        <div className="mg-art-mizu">
          <span className="mg-vstrip-mizu" aria-hidden="true">認定</span>

          <ImagePlaceholder
            base="/certs"
            src={c.badge}
            ratio="1/1"
            fit="contain"
            showCaption={false}
            alt={`${c.name} badge`}
            label={<>BADGE<br />1:1</>}
          />

          {/* Stamped seal, sitting off-square the way a hand-pressed
              one never quite lands straight. */}
          <span className="mg-seal-mizu" aria-hidden="true">証</span>
        </div>

        <div className="mg-cap-mizu">
          <h3 className="mg-name-mizu">{c.name}</h3>

          <p className="mg-meta-mizu">
            {c.issuer}
            <span className="mg-dot-mizu" aria-hidden="true">·</span>
            {c.issued}
            {c.expires && (
              <>
                <span className="mg-dot-mizu" aria-hidden="true">·</span>
                <span className="mg-exp-mizu">exp {c.expires}</span>
              </>
            )}
          </p>

          <p className="mg-id-mizu">
            <span className="mg-id-label-mizu">ID</span>
            {c.id}
          </p>
        </div>
      </div>
    </article>
  )
}
