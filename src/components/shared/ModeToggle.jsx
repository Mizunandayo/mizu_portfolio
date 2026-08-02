import { useMode, MODES } from '../../hooks/useMode.jsx'

/* Two-state segmented switch. Radios rather than a checkbox: both
   destinations are named, so a visitor can see what the other side is
   before committing to it. */
export default function ModeToggle({ className = '' }) {
  const { mode, choose } = useMode()

  return (
    <div className={`mode-sw-mizu ${className}`} role="group" aria-label="Presentation mode">
      {Object.values(MODES).map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mode-opt-mizu${mode === m.id ? ' is-on' : ''}`}
          onClick={() => choose(m.id)}
          aria-pressed={mode === m.id}
          title={m.hint}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
