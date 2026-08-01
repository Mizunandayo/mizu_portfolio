import { useParams, Navigate } from 'react-router-dom'
import Seo from '../components/Seo.jsx'
import DeckHero from '../components/deck/DeckHero.jsx'
import { Overview, Highlights, Architecture, TechStack, Gallery, Links, PrevNext } from '../components/deck/blocks.jsx'
import { bySlug, siblings } from '../data/projects.js'
import { metaFor } from '../seo.js'

export default function Project() {
  const { slug } = useParams()
  const project = bySlug(slug)

  if (!project) return <Navigate to="/404" replace />

  const { prev, next } = siblings(slug)
  const m = metaFor(`/work/${slug}`)

  return (
    <>
      <Seo {...m} />
      <main id="main">
        <article>
          <DeckHero project={project} />
          <Overview project={project} />
          <Highlights project={project} />
          <Architecture project={project} />
          <TechStack project={project} />
          <Gallery project={project} />
          <Links project={project} />
        </article>
        <PrevNext prev={prev} next={next} />
      </main>
    </>
  )
}
