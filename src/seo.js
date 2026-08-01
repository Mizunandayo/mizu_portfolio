import { PROFILE, SITE } from './data/profile.js'
import { PROJECTS, bySlug } from './data/projects.js'

/* Shared by the runtime <Seo> component and the build-time prerenderer,
   so a route's tags cannot drift between the two. */

export function metaFor(path) {
  if (path === '/') {
    return {
      title:       SITE.title,
      description: SITE.description,
      path:        '/',
      image:       `${SITE.url}/og/default.png`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: PROFILE.name,
        jobTitle: 'Software Engineer',
        description: SITE.description,
        url: SITE.url,
        email: `mailto:${PROFILE.contact.email}`,
        address: { '@type': 'PostalAddress', addressLocality: 'Limay', addressRegion: 'Central Luzon', addressCountry: 'PH' },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'Bataan Peninsula State University' },
        sameAs: [PROFILE.contact.linkedin, PROFILE.contact.github],
        knowsAbout: PROFILE.topSkills,
      },
    }
  }

  const slug = path.replace('/work/', '').replace(/\/$/, '')
  const p = bySlug(slug)
  if (!p) {
    return {
      title:       `Not found — ${PROFILE.name}`,
      description: 'That page does not exist.',
      path,
      image:       `${SITE.url}/og/default.png`,
      jsonLd:      null,
    }
  }

  return {
    title:       `${p.name} ${p.kanji} — ${p.tagline} | ${PROFILE.name}`,
    description: p.summary,
    path,
    image:       `${SITE.url}/og/${p.slug}.png`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: `${p.name} — ${p.tagline}`,
      description: p.summary,
      url: `${SITE.url}${path}`,
      dateCreated: p.period.start,
      creator: { '@type': 'Person', name: PROFILE.name, url: SITE.url },
      keywords: p.stack.flatMap((g) => g.items.map((i) => i.name)).join(', '),
    },
  }
}

export const ALL_ROUTES = ['/', ...PROJECTS.map((p) => `/work/${p.slug}`)]

/** Escapes text for safe interpolation into an HTML attribute. */
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Head markup injected into the prerendered HTML for a route. */
export function headFor(path) {
  const m = metaFor(path)
  const url = SITE.url + m.path
  const parts = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${m.path === '/' ? 'profile' : 'article'}" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(m.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${esc(m.image)}" />`,
  ]
  if (m.jsonLd) {
    parts.push(
      `<script type="application/ld+json" data-mizu-jsonld>${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>`
    )
  }
  return parts.join('\n    ')
}
