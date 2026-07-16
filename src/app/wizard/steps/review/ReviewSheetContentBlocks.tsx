import type { ReviewFeatureItem, ReviewStatItem } from './organizeReviewSheet'

export function StatGrid({ stats }: { stats: ReviewStatItem[] }) {
  return (
    <dl className="review-stat-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="review-stat-card">
          <dt className="review-stat-card__label">{stat.label}</dt>
          <dd className="review-stat-card__value">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function FeatureList({ items }: { items: ReviewFeatureItem[] }) {
  if (items.length === 0) {
    return <p className="review-sheet-empty">Nothing selected yet.</p>
  }

  return (
    <ul className="review-feature-list">
      {items.map((item) => (
        <li
          key={`${item.label}-${item.value}`}
          className="review-feature-list__item"
        >
          <span className="review-feature-list__label">{item.label}</span>
          {item.description !== undefined && item.description.length > 0 ? (
            <p className="review-feature-list__description">{item.description}</p>
          ) : null}
          {item.entries !== undefined && item.entries.length > 0 ? (
            <ul className="review-feature-list__entries">
              {item.entries.map((entry) => (
                <li
                  key={entry.label}
                  className="review-feature-list__entry"
                >
                  <span className="review-feature-list__entry-label">
                    {entry.label}
                  </span>
                  <p className="review-feature-list__entry-description">
                    {entry.description}
                  </p>
                </li>
              ))}
            </ul>
          ) : item.description === undefined || item.description.length === 0 ? (
            <span className="review-feature-list__value">{item.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function DetailLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) {
    return <p className="review-sheet-empty">Nothing selected yet.</p>
  }

  const isComingSoonOnly =
    lines.length === 1 && lines[0].toLowerCase() === 'coming soon'

  if (isComingSoonOnly) {
    return <p className="review-sheet-placeholder">Coming soon</p>
  }

  return (
    <ul className="review-detail-lines">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
