/* ══════════════════════════════════════════════════
   Music - the three tracks offered in the greeting.

   `src` is case-sensitive once deployed. Vercel serves
   from a Linux filesystem, so nuts.MP3 must keep its
   uppercase extension here or it 404s in production
   while working perfectly on Windows.
   ══════════════════════════════════════════════════ */

export const TRACKS = [
  {
    id: 'trackmaker',
    kanji: '幻',
    title: 'Illusionary Daytime',
    artist: 'Trackmaker',
    src: '/profile/trackmaker.mp3',
    cover: '/profile/trackmakercover.png',
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
