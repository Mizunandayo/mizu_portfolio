/* ══════════════════════════════════════════════════
   遊戯 — the games shelf.

   ▶ THIS IS WHERE THE NAMES AND LINKS GO.

   Drop an image into public/profile/games/ named
   game1, game2, game3 … in any of jpg, png, webp,
   avif or gif, then give that number a name below.

   A bare string is a name and nothing more. To make a
   card clickable, give it an object instead:

     3: { name: 'Some Game', url: 'https://store...' },

   Both forms work side by side, so a link can be added
   to one card without touching the others. A card with
   no url is not a link and does not pretend to be one.

   Keyed by number rather than listed in order on
   purpose: deleting game2 and keeping game3 would
   silently shift every name up by one in an array,
   and the caption under a card is the one thing that
   must not quietly become wrong. A number with no
   name still shows its card, captioned "Untitled".
   ══════════════════════════════════════════════════ */

export const GAMES = {
  1: {
    name: 'ARC Raiders',
    url: 'https://store.steampowered.com/app/1808500/ARC_Raiders/',
  },
  2: {
    name: 'Forza Horizon 6',
    url: 'https://store.steampowered.com/app/2483190/Forza_Horizon_6/',
  },
  3: {
    name: '日本事故物件監視協会2 -Japan Stigmatized Property-',
    url: 'https://store.steampowered.com/app/4193270/2_Japan_Stigmatized_Property/',
  },
  4: {
    name: 'Battlefield 6',
    url: 'https://store.steampowered.com/app/2807960/Battlefield_6/',
  },
}

/* The block under the row. The word is set large enough that it is the
   thing you read first, so it is deliberately one word. */
export const SHELF = {
  kicker: 'Mizu',
  centre: 'GAMES',
  note: 'Played and enjoyed.',
  word: 'ARCADE',
  caption:
    'Games I have played and enjoyed along the way. If I am not building ' +
    'something, this is usually where I am — come and find me.',
}

/* Where to actually find him. `handle` is shown on the button, so the
   tag is readable whether or not the link resolves. */
export const PROFILES = [
  {
    id: 'steam',
    label: 'Steam',
    handle: 'Mizu',
    url: 'https://steamcommunity.com/profiles/76561199034202219/',
  },
  {
    id: 'xbox',
    label: 'Xbox',
    handle: 'Mizu#5491',
    /* Unverified. Xbox has no stable public profile URL for a gamertag
       carrying a #suffix, and this query form is a best guess rather
       than something I could check. The handle above is the part that
       is certainly right, which is why it is on the button. */
    url: 'https://account.xbox.com/en-us/profile?gamertag=Mizu%235491',
  },
]
