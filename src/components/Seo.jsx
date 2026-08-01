import { useEffect } from 'react'
import { SITE } from '../data/profile.js'

/* Applies head tags imperatively. Exported so the project dialog can
   drive them while open and restore the underlying route's on close —
   the host page stays mounted, so its own <Seo> effect never re-runs. */
export function applyMeta({ title, description, path = '/', image, jsonLd }) {
  if (typeof document === 'undefined') return

  const url = SITE.url + path
  const img = image || `${SITE.url}/og/default.png`

  document.title = title

  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', img)
  setMeta('property', 'og:type', path === '/' ? 'profile' : 'article')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  setMeta('name', 'twitter:image', img)

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)

  if (jsonLd) {
    let node = document.querySelector('script[data-mizu-jsonld]')
    if (!node) {
      node = document.createElement('script')
      node.setAttribute('type', 'application/ld+json')
      node.setAttribute('data-mizu-jsonld', '')
      document.head.appendChild(node)
    }
    node.textContent = JSON.stringify(jsonLd)
  }
}

/* Sets head tags on client navigation. The same values are baked into
   the prerendered HTML at build time by scripts/prerender.js — this
   only has to keep them correct as the user moves between routes. */
export default function Seo({ title, description, path = '/', image, jsonLd }) {
  useEffect(() => {
    const url = SITE.url + path
    const img = image || `${SITE.url}/og/default.png`

    document.title = title

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', img)
    setMeta('property', 'og:type', path === '/' ? 'profile' : 'article')
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', img)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    if (jsonLd) {
      let node = document.querySelector('script[data-mizu-jsonld]')
      if (!node) {
        node = document.createElement('script')
        node.setAttribute('type', 'application/ld+json')
        node.setAttribute('data-mizu-jsonld', '')
        document.head.appendChild(node)
      }
      node.textContent = JSON.stringify(jsonLd)
    }
  }, [title, description, path, image, jsonLd])

  return null
}

function setMeta(attr, key, value) {
  if (!value) return
  let node = document.querySelector(`meta[${attr}="${key}"]`)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute(attr, key)
    document.head.appendChild(node)
  }
  node.setAttribute('content', value)
}
