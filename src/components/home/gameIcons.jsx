/* Brand marks for the two profile buttons.

   Steam's path is simple-icons' own, copied from the installed package
   rather than redrawn — it is the official outline and getting it
   slightly wrong is worse than not showing it. The package carries no
   Xbox mark, so that one is drawn here: the sphere with the crossed
   strokes, which is the part of the logo that reads at 18px. */

const BOX = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': 'true',
}

export const SteamIcon = () => (
  <svg {...BOX}>
    <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z" />
  </svg>
)

export const XboxIcon = () => (
  <svg {...BOX} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M5.2 19.2c1.9-3.6 4.2-6.6 6.8-9 2.6 2.4 4.9 5.4 6.8 9" />
    <path d="M4.1 5.6C6.5 7 9.1 9.2 12 12.1c2.9-2.9 5.5-5.1 7.9-6.5" />
  </svg>
)
