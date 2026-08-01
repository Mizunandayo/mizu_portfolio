import { CERTS_ORDERED, CERT_COUNT, CERT_ISSUERS } from '../../data/certifications.js'
import { SectionShell } from '../shared/primitives.jsx'
import { ImagePlaceholder } from '../shared/placeholders.jsx'
import { Reveal } from '../../hooks/useScrollReveal.jsx'

export default function Certifications() {
  return (
    <SectionShell
      id="certifications"
      wide
      eyebrow="Certifications"
      claim={`${CERT_COUNT} certifications across ${CERT_ISSUERS.length} issuers.`}
      copy="Newest first. Credential IDs are listed in full — there is no résumé PDF to go looking in."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {CERTS_ORDERED.map((c, i) => (
          <Reveal key={c.id} delay={Math.min((i % 4) + 1, 6)} className="h-full">
            <CertCard cert={c} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

function CertCard({ cert: c }) {
  return (
    <article className="cert-card-mizu">
      {/* Badge — square, contained rather than cropped so the mark
          is never clipped. Drop the file into /public/certs/. */}
      <div className="cert-badge-mizu">
        <ImagePlaceholder
          base="/certs"
          src={c.badge}
          ratio="1/1"
          fit="contain"
          showCaption={false}
          alt={`${c.name} badge`}
          label={<>BADGE<br />1:1</>}
        />
      </div>

      <div className="cert-issuer-mizu">{c.issuer}</div>

      <h3 className="cert-name-mizu">{c.name}</h3>

      <div className="cert-dates-mizu">
        <span>Issued {c.issued}</span>
        {c.expires && (
          <>
            <span aria-hidden="true" className="cert-sep-mizu">·</span>
            <span>Expires {c.expires}</span>
          </>
        )}
      </div>

      <div className="cert-id-mizu">
        <span className="cert-id-label-mizu">Credential ID</span>
        <span className="cert-id-value-mizu">{c.id}</span>
      </div>
    </article>
  )
}
