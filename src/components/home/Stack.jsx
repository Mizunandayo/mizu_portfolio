import { STACK } from '../../data/stack.js'
import { SectionShell, Layers } from '../shared/primitives.jsx'
import TechIcon from '../shared/TechIcon.jsx'

export default function Stack() {
  return (
    <SectionShell
      id="stack"
      eyebrow="Technology"
      claim="What I build with."
      copy="Aggregated across all nine projects, ordered by depth of use rather than recency."
    >
      <Layers
        groups={STACK}
        renderItem={(it, group) => (
          <div key={it.name} className="si-mizu">
            <TechIcon name={it.name} category={group.category} />
            <div className="si-text-mizu">
              {it.role && <span className="si-role-mizu">{it.role}</span>}
              <span className="si-name-mizu">
                {it.name}
                {it.ver && <span className="si-ver-mizu">{it.ver}</span>}
              </span>
            </div>
          </div>
        )}
      />
    </SectionShell>
  )
}
