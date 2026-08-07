import ART from 'virtual:game-art'
import BG from 'virtual:game-bg'
import { GAMES, SHELF, PROFILES } from '../../data/games.js'
import { SteamIcon, XboxIcon } from './gameIcons.jsx'
import Arcade from './arcade/Arcade.jsx'

/* ══════════════════════════════════════════════════
   遊戯 — the arcade.

   Games played rather than built, laid out the way a
   library lays out covers: the art and nothing else.
   Every cover already carries its own title in its own
   lettering, so anything printed over it would be the
   same name twice. Hovering catches the light on it.

   Images are found on disk at build time and paired
   with names from games.js by their number. See the
   plugin in vite.config.js.
   ══════════════════════════════════════════════════ */

const MARK = { steam: SteamIcon, xbox: XboxIcon }

/* An entry is either a name or a name with a link. Normalised in one
   place so the markup below never has to ask which it got. */
function entry(n) {
  const g = GAMES[n]
  if (typeof g === 'string') return { name: g, url: null }
  return { name: g?.name ?? 'Untitled', url: g?.url ?? null }
}

export default function Games() {
  /* Nothing on the shelf yet is not an empty poster, it is no poster. */
  if (!ART.length) return null

  /* Directly under the blurb that says come and find me, which is the
     sentence they answer. */
  const profiles = (
    <div className="gm-profiles-mizu">
      {PROFILES.map(({ id, label, handle, url }) => {
        const Icon = MARK[id]
        return (
          <a
            key={id}
            className={`gm-profile-mizu is-${id}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {Icon && <Icon />}
            <span className="gm-profile-text-mizu">
              <span className="gm-profile-label-mizu">{label}</span>
              <span className="gm-profile-handle-mizu">{handle}</span>
            </span>
          </a>
        )
      })}
    </div>
  )

  return (
    <section id="games" className="gm-mizu">
      {/* Whatever bg.* is sitting in public/profile/games/. The only
          place the backdrop is set — swapping it is a file swap, not
          an edit. */}
      <div
        className="gm-bg-mizu"
        aria-hidden="true"
        style={BG ? { backgroundImage: `url("${BG}")` } : undefined}
      />

      <div className="gm-inner-mizu">
        <header className="gm-head-mizu">
          <span className="gm-rule-mizu" aria-hidden="true" />
          <span className="gm-kicker-mizu">{SHELF.kicker}</span>
          <h2 className="gm-centre-mizu">{SHELF.centre}</h2>
          <span className="gm-note-mizu">{SHELF.note}</span>
          <span className="gm-rule-mizu" aria-hidden="true" />
        </header>

        <ul className="gm-row-mizu">
          {ART.map(({ n, src }) => {
            const { name, url } = entry(n)
            /* An anchor only when there is somewhere to go. A card that
               looks clickable and is not is worse than a plain one. */
            const Tag = url ? 'a' : 'div'
            const link = url
              ? { href: url, target: '_blank', rel: 'noopener noreferrer' }
              : {}

            return (
              <li key={n}>
                <Tag className={`gm-card-mizu${url ? ' is-link' : ''}`} {...link}>
                  {/* Unoptimised on purpose: a gif has to stay a gif to
                      keep moving, and these are hand-picked rather than
                      user uploads, so there is nothing to sanitise. */}
                  <img src={src} alt={name} loading="lazy" decoding="async" />

                  {/* Nothing but the sheen. The cover carries its own
                      title, and `name` is on the img above, which is
                      what a screen reader and the link both read. */}
                  <span className="gm-veil-mizu" aria-hidden="true" />
                </Tag>
              </li>
            )
          })}
        </ul>

        <p className="gm-word-mizu" aria-hidden="true">{SHELF.word}</p>
        <p className="gm-caption-mizu">{SHELF.caption}</p>

        {profiles}

        {/* Games played above, games built below. They were running into
            each other as one undifferentiated block, which buried the
            fact that the cabinets are mine. */}
        <div className="gm-play-mizu">
          <header className="gm-play-head-mizu">
            <span className="gm-play-jp-mizu" aria-hidden="true">遊技場</span>
            <h3 className="gm-play-title-mizu">Mizuki&rsquo;s Playground</h3>
            <p className="gm-play-note-mizu">
              Play 4 retro games for a little entertainment
            </p>
          </header>

          <Arcade />
        </div>
      </div>
    </section>
  )
}
