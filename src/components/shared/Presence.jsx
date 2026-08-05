import { useEffect, useRef, useState } from 'react'
import { PROFILE } from '../../data/profile.js'

/* Discord presence via Lanyard, a public read-only mirror. Polled
   rather than socketed: the WebSocket needs a handshake, a subscribe
   frame and a heartbeat, which is a lot to shave 20s off this. */

const POLL = 25000

/* Type 4 is a custom status, a mood rather than an activity. */
const VERB = {
  0: 'Playing',
  1: 'Streaming',
  2: 'Listening to',
  3: 'Watching',
  5: 'Competing in',
}

const LABEL = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
}

const CDN = 'https://cdn.discordapp.com'

const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const FN_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : ''

/* public_flags is a bitfield; the icon hashes are fixed and undocumented,
   so every one below was checked against a live CDN response. Active
   Developer (1 << 22) is left out because its hash 404s and a guessed
   one is worse than a missing badge. Nitro and boost need OAuth, so they
   are not reachable from a public endpoint at all. */
const BADGES = [
  [1 << 0, 'Discord Staff', '5e74e9b61934fc1f67c65515d1f7e60d'],
  [1 << 1, 'Partnered Server Owner', '3f9748e53446a137a052f3454e2de41e'],
  [1 << 2, 'HypeSquad Events', 'bf01d1073931f921909045f3a39fd264'],
  [1 << 3, 'Bug Hunter', '2717692c7dca7289b35297368a940dd0'],
  [1 << 6, 'HypeSquad Bravery', '8a88d63823d8a71cd5e390baa45efa02'],
  [1 << 7, 'HypeSquad Brilliance', '011940fd013da3f7fb926e4a1cd2e618'],
  [1 << 8, 'HypeSquad Balance', '3aa41de486fa12454c3761e8e223442e'],
  [1 << 9, 'Early Supporter', '7060786766c9c840eb3019e725d2b358'],
  [1 << 14, 'Bug Hunter Gold', '848f79194d4be5ff5f81505cbd0ce1e6'],
  [1 << 17, 'Early Verified Bot Developer', '6df5892e0f35b051f8b61eace34f4967'],
  [1 << 18, 'Moderator Programs Alumni', 'fee1624003e2fee35cb398e125dc479b'],
]

/* Lanyard reports no last-seen, so it is recorded here whenever a poll
   catches him online. That makes it per-browser: it is when THIS visitor
   last saw him, not when he was last online. Past a day the stored stamp
   is too likely to be wrong to quote, so it is dropped. */
const SEEN_KEY = 'mizu:presence-seen'
const SEEN_MAX = 24 * 60 * 60 * 1000

function readSeen() {
  try {
    const v = Number(window.localStorage.getItem(SEEN_KEY))
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

function writeSeen(t) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(t))
  } catch {
    /* private mode, quota, or storage blocked */
  }
}

/* Activity assets arrive in three shapes; only the last is a Discord file. */
function assetUrl(raw, appId) {
  if (!raw) return null
  if (raw.startsWith('mp:')) return `https://media.discordapp.net/${raw.slice(3)}`
  if (raw.startsWith('spotify:')) return `https://i.scdn.co/image/${raw.slice(8)}`
  return `${CDN}/app-assets/${appId}/${raw}.png`
}

/* A game Discord detected by itself carries no assets at all, only an
   application_id. The tile Discord shows in that case is the app's own
   icon, whose hash sits behind an endpoint with no CORS header, so it
   takes a hop through an Edge Function. Resolved once per app per page:
   an icon does not change while someone is looking at the card. */
const ICONS = new Map()

function appIcon(appId) {
  if (!appId || !FN_BASE) return Promise.resolve(null)
  if (ICONS.has(appId)) return ICONS.get(appId)

  const p = fetch(`${FN_BASE}/app-icon?id=${appId}`, {
    headers: ANON ? { apikey: ANON } : {},
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => d?.url ?? null)
    .catch(() => null)

  ICONS.set(appId, p)
  return p
}

/* Streaming apps put the episode in the cover's alt text, spelled out.
   Discord compresses it to S1E4 and so does this. */
const episode = (t) => {
  const m = /season\s*(\d+)\D+episode\s*(\d+)/i.exec(t || '')
  return m ? `S${m[1]}E${m[2]}` : null
}

const EpIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="1.4" y="3.2" width="13.2" height="9.6" rx="1.9" />
    <path d="M6.6 6.4 10.3 8 6.6 9.6Z" fill="currentColor" stroke="none" />
  </svg>
)

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const pad = (n) => String(n).padStart(2, '0')
  return s >= 3600
    ? `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
    : `${Math.floor(s / 60)}:${pad(s % 60)}`
}

/* A bar when Discord gives both ends of the track, a count-up when it
   only gives the start. Its own component so the ticking second
   re-renders this and nothing else. */
function Track({ start, end }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!end) return <span className="pr-time-mizu">{clock(now - start)} elapsed</span>

  const total = end - start
  const at = Math.min(Math.max(now - start, 0), total)

  return (
    <span className="pr-track-mizu">
      <span className="pr-clock-mizu">{clock(at)}</span>
      <span className="pr-bar-mizu">
        <i style={{ '--p': `${(at / total) * 100}%` }} />
      </span>
      <span className="pr-clock-mizu">{clock(total)}</span>
    </span>
  )
}

/* Scrolls only when the text actually overruns its column, so short
   titles stay put. Falls back to plain text with an ellipsis when it
   fits, when motion is reduced, or before the first measurement. */
function Marquee({ className, text }) {
  const box = useRef(null)
  const inner = useRef(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    const b = box.current
    if (!b) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShift(0)
      return
    }

    const measure = () => {
      if (!box.current || !inner.current) return
      /* The child's own width, not the parent's scrollWidth. A translated
         child still counts toward scrollWidth, so a measurement taken
         mid-scroll would read the overflow as already consumed and stop
         the marquee. Translation does not change a bounding width. */
      const over =
        inner.current.getBoundingClientRect().width - box.current.clientWidth
      /* Identical state bails out of the re-render, so observing our own
         element cannot feed back into itself. */
      setShift(over > 2 ? Math.round(over) : 0)
    }

    measure()
    /* Poppins arrives after first paint and changes every width. */
    document.fonts?.ready.then(measure)

    const ro = new ResizeObserver(measure)
    ro.observe(b)
    return () => ro.disconnect()
  }, [text])

  /* The forward leg is 33% of the cycle and the return 43%, so one
     duration gives an outbound ~38px/s and a visibly slower return. */
  const dur = shift ? Math.min(24, Math.max(6, shift / 12.5)) : 0

  return (
    <span
      ref={box}
      className={`${className} pr-mq-mizu${shift ? ' is-scroll' : ''}`}
      style={
        shift
          ? { '--mq-shift': `${shift}px`, '--mq-dur': `${dur}s` }
          : undefined
      }
    >
      <span ref={inner}>{text}</span>
    </span>
  )
}

/* Coarser than Elapsed: nothing below a minute is worth a tick. */
function Ago({ since }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const s = Math.max(0, Math.floor((now - since) / 1000))
  const m = Math.floor(s / 60)
  const h = Math.floor(s / 3600)
  const text =
    s < 60 ? 'just now' : h < 1 ? `${m} min ago` : `${h} hr ago`

  return <span className="pr-time-mizu">Last seen {text}</span>
}

export default function Presence() {
  const [data, setData] = useState(null)
  const [gameIcon, setGameIcon] = useState(null)
  const id = PROFILE.discordId

  useEffect(() => {
    if (!id) return
    let dead = false

    const pull = async () => {
      try {
        const r = await fetch(`https://api.lanyard.rest/v1/users/${id}`)
        if (!r.ok) throw new Error(String(r.status))
        const json = await r.json()
        const d = json?.success ? json.data : null
        if (d?.discord_status && d.discord_status !== 'offline') {
          writeSeen(Date.now())
        }
        if (!dead) setData(d)
      } catch {
        if (!dead) setData(null)
      }
    }

    pull()
    const t = window.setInterval(pull, POLL)
    return () => {
      dead = true
      clearInterval(t)
    }
  }, [id])

  /* Only when the activity has nothing of its own to show. Keyed on the
     application id so a poll that returns the same game does not refetch,
     and cleared between games so one icon never outlives its activity. */
  useEffect(() => {
    const a = data?.activities?.find((x) => x.type !== 4)
    const needs = a && !a.assets?.large_image && a.application_id

    if (!needs) {
      setGameIcon(null)
      return undefined
    }

    let dead = false
    appIcon(a.application_id).then((url) => {
      if (!dead) setGameIcon(url)
    })
    return () => { dead = true }
  }, [data?.activities?.find((x) => x.type !== 4)?.application_id])

  const status = data?.discord_status
  /* Still bails when the fetch told us nothing — an empty card is worse
     than none. Offline is a state we know, so it renders. */
  if (!data || !status) return null

  const offline = status === 'offline'
  const seenAt = offline ? readSeen() : null
  const seen = seenAt && Date.now() - seenAt < SEEN_MAX ? seenAt : null

  const user = data.discord_user ?? {}
  const name = user.username || user.global_name || 'Discord'

  /* An `a_` prefix on the hash means the avatar is animated. */
  const avatar = user.avatar
    ? `${CDN}/avatars/${user.id}/${user.avatar}.${
        user.avatar.startsWith('a_') ? 'gif' : 'png'
      }?size=128`
    : null

  /* passthrough=true is what keeps a decoration animated. */
  const deco = user.avatar_decoration_data?.asset
    ? `${CDN}/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=96&passthrough=true`
    : null

  const guild = user.primary_guild?.tag ? user.primary_guild : null
  const guildBadge = guild
    ? `${CDN}/guild-tag-badges/${guild.identity_guild_id}/${guild.badge}.png?size=32`
    : null

  const flags = user.public_flags ?? 0
  const badges = BADGES.filter(([bit]) => flags & bit).map(([, name, hash]) => ({
    name,
    url: `${CDN}/badge-icons/${hash}.png`,
  }))

  const spotify = !offline && data.listening_to_spotify ? data.spotify : null
  const act = offline ? null : data.activities?.find((a) => a.type !== 4)
  const custom = offline
    ? null
    : data.activities?.find((a) => a.type === 4)?.state

  /* Null rather than falling back to the status label, which is already
     printed beside the name. */
  const line = spotify
    ? {
        verb: 'Listening to',
        title: spotify.song,
        sub: spotify.artist,
        art: spotify.album_art_url,
        alt: spotify.album,
        start: spotify.timestamps?.start ?? null,
        end: spotify.timestamps?.end ?? null,
      }
    : act
      ? {
          verb: VERB[act.type] ?? 'Playing',
          title: act.name,
          sub: act.details || act.state || '',
          art: assetUrl(act.assets?.large_image, act.application_id) || gameIcon,
          small: assetUrl(act.assets?.small_image, act.application_id),
          alt: act.assets?.large_text || act.name,
          ep: episode(act.assets?.large_text),
          epFull: act.assets?.large_text || null,
          start: act.timestamps?.start ?? null,
          end: act.timestamps?.end ?? null,
        }
      : custom
        ? { verb: '', title: custom, sub: '', art: null, start: null }
        : null

  return (
    <a
      /* Status class drives one colour variable, which the dot and the
         label both read. */
      className={`pr-mizu is-${status}`}
      href={`https://discord.com/users/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${name} on Discord — ${LABEL[status] ?? status}${
        line?.title ? `, ${line.verb} ${line.title}` : ''
      }. Opens Discord in a new tab.`}
    >
      <span className="pr-slip-mizu" aria-hidden="true">
        在席
      </span>

      <span className="pr-ava-mizu">
        {avatar && (
          <img
            className="pr-ava-img-mizu"
            src={avatar}
            alt=""
            referrerPolicy="no-referrer"
          />
        )}
        {deco && (
          <img
            className="pr-deco-mizu"
            src={deco}
            alt=""
            referrerPolicy="no-referrer"
          />
        )}
        <span className="pr-dot-mizu" aria-hidden="true" />
      </span>

      <span className="pr-body-mizu">
        <span className="pr-top-mizu">
          <span className="pr-name-mizu">{name}</span>

          {guild && (
            <span className="pr-tag-mizu">
              {guildBadge && (
                <img
                  src={guildBadge}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                />
              )}
              {guild.tag}
            </span>
          )}

          {badges.length > 0 && (
            <span className="pr-badges-mizu">
              {badges.map((b) => (
                <img
                  key={b.name}
                  src={b.url}
                  alt={b.name}
                  referrerPolicy="no-referrer"
                />
              ))}
            </span>
          )}
        </span>

        {line && (
          <>
            <span className="pr-line-mizu">
              {line.verb && <span className="pr-verb-mizu">{line.verb}</span>}
              <Marquee className="pr-title-mizu" text={line.title} />
            </span>

            {(line.sub || line.ep) && (
              <span className="pr-sub-row-mizu">
                {line.ep && (
                  <span className="pr-ep-mizu" data-tip={line.epFull}>
                    <EpIcon />
                    {line.ep}
                  </span>
                )}
                {line.sub && <Marquee className="pr-sub-mizu" text={line.sub} />}
              </span>
            )}
            {line.start && <Track start={line.start} end={line.end} />}
          </>
        )}

        {offline && seen && <Ago since={seen} />}
      </span>

      {/* alt is empty on purpose: the artwork repeats the two lines beside
          it, and a failed load then renders nothing rather than stray text. */}
      {line?.art && (
        <span className="pr-cover-mizu">
          <img
            src={line.art}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {line.small && (
            <img
              className="pr-cover-sm-mizu"
              src={line.small}
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
        </span>
      )}

      {/* The wrapper is the mask. Its bottom edge sits on the card's top
          edge, so the blade sliding up inside it emerges from behind the
          card. Eager, not lazy: it is above the fold and a lazy load
          would leave the first hover blank while it fetches. */}
      <span className="pr-katana-mizu" aria-hidden="true">
        <img src="/profile/discordpresencehover.png" alt="" />
      </span>

      {/* aria-hidden: the anchor's own label already says it opens Discord,
          so announcing this too would just say it twice. */}
      <span className="pr-cta-mizu" aria-hidden="true">
        Let&apos;s connect on Discord!
      </span>
    </a>
  )
}
