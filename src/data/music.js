/* ══════════════════════════════════════════════════
   Music - the three tracks offered in the greeting.

   `src` is case-sensitive once deployed. Vercel serves
   from a Linux filesystem, so nuts.MP3 must keep its
   uppercase extension here or it 404s in production
   while working perfectly on Windows.
   ══════════════════════════════════════════════════ */

export const TRACKS = [
  {
    id: 'sdpinterlude',
    /* 間 — the interval between two things. The other two are 走 for
       the drift and 律 for the rhythm; this one names the pause. */
    kanji: '間',
    title: 'SDP Interlude',
    artist: 'Travis Scott',
    src: '/profile/sdpinterlude.mp3',
    cover: '/profile/sdpinterludecover.png',
  },
  {
    id: 'tokyodrift',
    kanji: '走',
    title: 'Tokyo Drift',
    artist: 'Teriyaki Boyz',
    src: '/profile/tokyodrift.mp3',
    cover: '/profile/tokyodriftcover.png',
  },
  {
    id: 'nuts',
    kanji: '律',
    title: 'Nuts',
    artist: 'Lil Peep',
    src: '/profile/nuts.MP3',
    cover: '/profile/nutscover.png',
  },
]

export const byTrack = (id) => TRACKS.find((t) => t.id === id) ?? null
