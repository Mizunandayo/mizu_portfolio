import { useEffect, useState } from 'react'

/* Debounced "is this name already used" check, shared by the ticket
   maker, the greeting modal and the arcade gate.

   Returns null when there is nothing to say, 'checking' while a request
   is out, false when the name is free, or the draft string itself when
   it is taken. Returning the draft rather than a bare true is what lets
   a caller tell whether the answer still matches what is in the field.

   `alive` guards the in-flight request: clearing the timeout only stops
   one that has not gone out yet, and a slow reply for an older draft
   would otherwise resolve on top of a newer one and mark a free name
   taken. `check` must be a stable reference or this re-runs every
   render. */
export default function useNameTaken(draft, check, opts = {}) {
  const { min = 2, wait = 400, skip = false } = opts
  const [taken, setTaken] = useState(null)

  useEffect(() => {
    const v = draft.trim()
    if (skip || v.length < min) {
      setTaken(null)
      return
    }

    let alive = true
    setTaken('checking')
    const t = setTimeout(async () => {
      try {
        const hit = await check(v)
        if (alive) setTaken(hit ? v : false)
      } catch {
        /* A check that could not run must not hold the form shut. */
        if (alive) setTaken(false)
      }
    }, wait)

    return () => { alive = false; clearTimeout(t) }
  }, [draft, check, min, wait, skip])

  return taken
}
