/* ══════════════════════════════════════════════════
   Closing — the last plate.

   A quote set against a full-bleed backdrop, ranged
   right so the line endings stack rather than the
   beginnings. Nothing to interact with: it is the
   full stop after the work.
   ══════════════════════════════════════════════════ */

export default function Closing() {
  return (
    <section id="closing" className="cl-mizu">
      <div className="cl-bg-mizu" aria-hidden="true" />

      <blockquote className="cl-quote-mizu">
        <p className="cl-jp-mizu" lang="ja">
          今ここで限界を超えろ。それしか道はねぇ。
        </p>

        {/* The break is authored rather than left to wrapping: it falls
            on the sentence, and a max-width that happened to produce it
            at one size would put it mid-clause at the next. Dropped on
            narrow screens, where the line cannot hold either half. */}
        <p className="cl-en-mizu">
          Right now, right here. Surpass your limits.
          <br />
          There is no other way.
        </p>

        <footer className="cl-by-mizu">
          <cite>-Yami Sukehiro</cite>
        </footer>
      </blockquote>
    </section>
  )
}
