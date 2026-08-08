/* Drawn rather than emoji: an emoji trophy renders as whatever the
   viewer's platform ships, at a size nothing else on the page matches. */

const METAL = {
  1: { id: 'ar-cup-au', size: 30, glow: '#ffd76a', stops: ['#fff0bd', '#ffd76a', '#e0a733', '#9d6d14'], shine: 0.28 },
  2: { id: 'ar-cup-ag', size: 26, glow: '#dfe5ee', stops: ['#ffffff', '#dfe5ee', '#a3acbb', '#6f7885'], shine: 0.38 },
  3: { id: 'ar-cup-cu', size: 23, glow: '#eda86a', stops: ['#ffd9b4', '#eda86a', '#c07536', '#7d4418'], shine: 0.3 },
}

export default function Trophy({ place }) {
  const m = METAL[place]
  if (!m) return null
  const fill = `url(#${m.id})`

  return (
    <svg
      className="ar-cup-mizu"
      width={m.size}
      height={m.size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ '--glow': m.glow }}
    >
      <defs>
        <linearGradient id={m.id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={m.stops[0]} />
          <stop offset="0.38" stopColor={m.stops[1]} />
          <stop offset="0.72" stopColor={m.stops[2]} />
          <stop offset="1" stopColor={m.stops[3]} />
        </linearGradient>
      </defs>

      <path
        d="M6.9 4H4.1A1.1 1.1 0 0 0 3 5.1v1.4A4.6 4.6 0 0 0 7.4 11"
        fill="none" stroke={fill} strokeWidth="1.7" strokeLinecap="round"
      />
      <path
        d="M17.1 4h2.8A1.1 1.1 0 0 1 21 5.1v1.4A4.6 4.6 0 0 1 16.6 11"
        fill="none" stroke={fill} strokeWidth="1.7" strokeLinecap="round"
      />

      <path d="M6.6 2.6h10.8v5.9c0 3-2.4 5.4-5.4 5.4s-5.4-2.4-5.4-5.4V2.6Z" fill={fill} />
      <path
        d="M8.4 3.9v4.4c0 1.5.7 2.8 1.8 3.6-2-.5-3.4-2.2-3.4-4.3V3.9h1.6Z"
        fill="#fff" opacity={m.shine}
      />

      <path d="M11 13.9h2v3.1h-2z" fill={fill} />
      <path d="M8.5 17h7l1 2.2h-9z" fill={fill} />
      <rect x="6.8" y="19.2" width="10.4" height="2.2" rx="0.7" fill={fill} />
    </svg>
  )
}
