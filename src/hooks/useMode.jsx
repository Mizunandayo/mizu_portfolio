import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/* ══════════════════════════════════════════════════
   Mode — personal / recruiter.

   One set of content, two presentations. Recruiter
   mode strips the Japanese layer — torii, tategaki
   spine, manga sheet, ofuda, photographic backdrop,
   loading screen — and leaves plain sections a hiring
   manager can skim. Nothing is hidden from them but
   ornament.

   The switch is a class on <html> rather than React
   state threaded through every section: the two modes
   differ almost entirely in presentation, and one
   class keeps the components as a single source of
   truth for the content.
   ══════════════════════════════════════════════════ */

export const MODES = {
  personal: {
    id: 'personal',
    label: 'Personal',
    hint: 'The full thing — Japanese layout, loading screen, the lot.',
  },
  recruiter: {
    id: 'recruiter',
    label: 'Recruiter',
    hint: 'Plain sections, no ornament, straight to the work.',
  },
}

export const STORE = 'mizu-mode'
const CLASS = 'mode-recruiter'

const Ctx = createContext(null)
export const useMode = () => useContext(Ctx)

export function ModeProvider({ children }) {
  /* Initial state must match the prerendered HTML, which carries no
     class. The inline script in index.html has already applied the
     saved choice to <html> before first paint, so the sync below
     adopts what is on the page rather than overwriting it — reading
     the DOM here is what avoids a flash of the wrong mode. */
  const [mode, setMode] = useState('personal')

  useEffect(() => {
    const el = document.documentElement
    let saved = null
    try { saved = localStorage.getItem(STORE) } catch { /* private mode */ }

    const initial = saved === 'recruiter' || el.classList.contains(CLASS)
      ? 'recruiter'
      : 'personal'

    el.classList.toggle(CLASS, initial === 'recruiter')
    setMode(initial)
  }, [])

  const choose = useCallback((next) => {
    setMode(next)
    document.documentElement.classList.toggle(CLASS, next === 'recruiter')
    try { localStorage.setItem(STORE, next) } catch { /* private mode */ }
  }, [])

  const toggle = useCallback(() => {
    choose(document.documentElement.classList.contains(CLASS) ? 'personal' : 'recruiter')
  }, [choose])

  return (
    <Ctx.Provider value={{ mode, choose, toggle, isRecruiter: mode === 'recruiter' }}>
      {children}
    </Ctx.Provider>
  )
}
