import type { SpeciesHighlights } from './resolveSpeciesHighlights'
import { hasSpeciesHighlights } from './resolveSpeciesHighlights'

export type SpeciesHighlightsPanelProps = {
  highlights: SpeciesHighlights
}

export function SpeciesHighlightsPanel({
  highlights,
}: SpeciesHighlightsPanelProps) {
  if (!hasSpeciesHighlights(highlights)) {
    return (
      <aside
        className="species-picker__highlights"
        aria-labelledby="species-highlights-heading"
      >
        <h4 id="species-highlights-heading" className="species-picker__highlights-title">
          Highlights
        </h4>
        <p className="species-picker__highlights-empty">
          No special senses or alternate movement.
        </p>
      </aside>
    )
  }

  return (
    <aside
      className="species-picker__highlights"
      aria-labelledby="species-highlights-heading"
    >
      <h4 id="species-highlights-heading" className="species-picker__highlights-title">
        Highlights
      </h4>

      {highlights.senses.length > 0 ? (
        <div className="species-picker__highlights-group">
          <h5 className="species-picker__highlights-group-title">Senses</h5>
          <ul className="species-picker__highlights-list">
            {highlights.senses.map((sense) => (
              <li key={sense.kind}>
                <span className="species-picker__highlights-label">
                  {sense.label}
                </span>{' '}
                <span className="species-picker__highlights-detail">
                  {sense.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {highlights.movement.length > 0 ? (
        <div className="species-picker__highlights-group">
          <h5 className="species-picker__highlights-group-title">Movement</h5>
          <ul className="species-picker__highlights-list">
            {highlights.movement.map((entry) => (
              <li key={entry.kind}>
                <span className="species-picker__highlights-label">
                  {entry.label}
                </span>{' '}
                <span className="species-picker__highlights-detail">
                  {entry.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
