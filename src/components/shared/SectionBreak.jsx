/* ══════════════════════════════════════════════════
   Section break — full-bleed 3:1 band between sections.

   Decorative, so it stays out of the accessibility
   tree entirely: an empty alt plus aria-hidden. A
   screen reader announcing six unnamed images between
   the sections would be pure noise.

   Files live in /public/profile and are referenced by
   path rather than imported — they are swappable art,
   not build inputs, so replacing one should not need a
   rebuild of anything but the copy on disk.
   ══════════════════════════════════════════════════ */
export default function SectionBreak({ src }) {
  return (
    <div className="brk-mizu" aria-hidden="true">
      <img
        src={`/profile/${src}`}
        alt=""
        /* Six full-bleed images below the fold — none of them should
           compete with the hero for bandwidth. */
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
