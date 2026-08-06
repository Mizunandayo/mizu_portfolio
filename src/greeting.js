/* Whether the greeting still has to run this session.

   Read by the hero as well as by the greeting itself. The hero mounts
   long before the panel opens, so it cannot wait to be told — it has to
   work out for itself that something is about to cover it and start
   silent. Both reading one function is what stops the two from
   disagreeing about it. */

export const WELCOME_STORE = 'mizu-welcome'

export function greetingPending() {
  if (typeof window === 'undefined') return false
  /* index.html applies this before first paint, so it is already
     accurate here — no need to wait for the mode context. */
  if (document.documentElement.classList.contains('mode-recruiter')) return false
  try {
    return !sessionStorage.getItem(WELCOME_STORE)
  } catch {
    return false
  }
}
