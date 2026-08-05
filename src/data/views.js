import { useEffect, useState } from 'react'
import { db, configured } from './supabase.js'

/* ══════════════════════════════════════════════════
   Total views.

   One call on mount, no heartbeat. The count is
   cumulative, so there is nothing to keep alive and
   nothing to poll: it writes this session once and
   reads the total back in the same request.

   Counted per browser session, so a reload does not
   add to it. That is the number people mean by
   "views" rather than raw page loads.
   ══════════════════════════════════════════════════ */

const KEY = 'mizu:view'

function sessionId() {
  try {
    let k = sessionStorage.getItem(KEY)
    if (!k) {
      k = crypto.randomUUID()
      sessionStorage.setItem(KEY, k)
    }
    return k
  } catch {
    return (sessionId.fallback ??= crypto.randomUUID())
  }
}

export function useViews() {
  const [n, setN] = useState(null)

  useEffect(() => {
    if (!configured) return undefined

    let dead = false
    db.rpc('bump_views', { p_session: sessionId() })
      .then((out) => {
        const v = Array.isArray(out) ? out[0] : out
        const num = Number(v)
        if (!dead && Number.isFinite(num)) setN(num)
      })
      .catch(() => {
        /* Offline, or the function is not deployed. The row says nothing
           rather than an error nobody can act on. */
      })

    return () => { dead = true }
  }, [])

  return n
}
