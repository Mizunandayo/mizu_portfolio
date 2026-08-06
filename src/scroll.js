/* ══════════════════════════════════════════════════
   Where a jump to a section should land.

   `start` everywhere, which puts the heading under the
   top of the screen and the reader at the beginning of
   the section. That is what a jump should do.

   The one exception is named rather than inferred. The
   subscribe band runs past 2000px with its content
   vertically centred, so aligning its top leaves the
   reader a full screen above the form. Other tall
   sections still begin at their heading, because that
   is where their content begins.
   ══════════════════════════════════════════════════ */

const CENTRED = new Set(['#subscribe'])

export function scrollToHash(target) {
  let el = null
  try {
    el = typeof target === 'string' ? document.querySelector(target) : target
  } catch {
    /* An id that is not a valid selector. Nothing to scroll to. */
  }
  if (!el) return false

  const centre = typeof target === 'string' && CENTRED.has(target)
  el.scrollIntoView({ behavior: 'smooth', block: centre ? 'center' : 'start' })
  return true
}
