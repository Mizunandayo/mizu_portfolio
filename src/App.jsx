import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Project from './pages/Project.jsx'
import NotFound from './pages/NotFound.jsx'
import ProjectDialog from './components/deck/ProjectDialog.jsx'

/* Route changes start at the top; an incoming #hash wins over that.
   Suppressed while a dialog is open — the page behind must not move. */
function ScrollManager({ frozen }) {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (frozen) return

    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash, frozen])

  return null
}

export default function App() {
  const location = useLocation()

  /* Set by links in the work grid, hackathons and experience sections. Its
     presence means "render this project over whatever is already on
     screen" instead of navigating. A cold load, a shared link and the
     prerenderer have no such state, so /work/<slug> resolves to the
     standalone page as normal. */
  const background = location.state?.background

  return (
    <>
      <a href="#main" className="skip-mizu">Skip to content</a>
      <ScrollManager frozen={!!background} />
      <Nav />

      <Routes location={background || location}>
        <Route path="/" element={<Home />} />
        <Route path="/work/:slug" element={<Project />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {background && (
        <Routes>
          <Route path="/work/:slug" element={<ProjectDialog />} />
        </Routes>
      )}

      <Footer />
    </>
  )
}
