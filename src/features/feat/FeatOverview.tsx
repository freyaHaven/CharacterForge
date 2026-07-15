import type { FeatDefinition } from '../../domain/feat/types'
import {
  formatFeatPrerequisite,
} from '../../domain/feat/eligibility'
import { formatFeatCategory } from './formatFeatDetails'

type FeatOverviewProps = {
  definition: FeatDefinition
  isCommitted: boolean
}

export function FeatOverview({ definition, isCommitted }: FeatOverviewProps) {
  return (
    <article className="feat-picker__overview">
      {isCommitted ? (
        <p className="feat-picker__selected-banner" role="status">
          Selected feat: <strong>{definition.name}</strong>
        </p>
      ) : null}

      <header className="feat-picker__overview-header">
        <p className="feat-picker__overview-category">
          {formatFeatCategory(definition.category)}
        </p>
        <h3>{definition.name}</h3>
        <p className="feat-picker__overview-lead">{definition.description}</p>
      </header>

      <dl className="feat-picker__metadata">
        <div className="feat-picker__metadata-item">
          <dt>Prerequisite</dt>
          <dd>{formatFeatPrerequisite(definition.prerequisite)}</dd>
        </div>
        <div className="feat-picker__metadata-item">
          <dt>Repeatable</dt>
          <dd>{definition.repeatable ? 'Yes' : 'No'}</dd>
        </div>
      </dl>

      {definition.benefits.length > 0 ? (
        <section className="feat-picker__benefits" aria-labelledby="feat-benefits-heading">
          <h4 id="feat-benefits-heading" className="feat-picker__section-title">
            Benefits
          </h4>
          <ul className="feat-picker__benefit-list">
            {definition.benefits.map((benefit) => (
              <li key={benefit.id} className="feat-picker__benefit">
                <strong>{benefit.name}</strong>
                <p>{benefit.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
