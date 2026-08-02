/* ══════════════════════════════════════════════════
   Cross-tree signals.

   For the handful of moments where one component has to
   tell a distant one something once, and threading a
   callback through every layer between them would cost
   more than it explains.

   Named here rather than inlined at both ends so a typo
   is a build error instead of an event nobody hears.
   ══════════════════════════════════════════════════ */

/* Greeting → Hero. Fired when the visitor declines the playlist, so
   the hero video takes the sound instead. Must be dispatched from
   inside a real gesture's call stack: unmuting needs user activation. */
export const HERO_SOUND = 'mizu:hero-sound'
