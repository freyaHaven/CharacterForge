import { SpeciesIcon } from '../../../../features/species/SpeciesIcon'
import type { ReviewSpeciesCardModel } from '../../../buildReviewSheetModels'

export function ReviewSpeciesCard({
  model,
  onEdit,
}: {
  model: ReviewSpeciesCardModel
  onEdit?: () => void
}) {
  return (
    <article className="review-content-card" aria-labelledby="review-species-heading">
      <div className="review-content-card__header">
        <h3 id="review-species-heading" className="review-content-card__title">
          Species
        </h3>
        {onEdit !== undefined ? (
          <button type="button" className="review-sheet-section__edit" onClick={onEdit}>
            Edit
          </button>
        ) : null}
      </div>
      <div className="review-content-card__identity">
        <span className="review-content-card__icon-disc" aria-hidden="true">
          <SpeciesIcon speciesId={model.speciesId} />
        </span>
        <div>
          <p className="review-content-card__name">{model.name}</p>
        </div>
      </div>
      <dl className="review-content-card__stats">
        {model.ancestryLabel !== null ? (
          <div>
            <dt>Ancestry</dt>
            <dd>{model.ancestryLabel}</dd>
          </div>
        ) : null}
        <div>
          <dt>Size</dt>
          <dd>{model.sizeLabel}</dd>
        </div>
        <div>
          <dt>Speed</dt>
          <dd>{model.speedFeet} ft.</dd>
        </div>
      </dl>
      {model.traits.length > 0 ? (
        <ul className="review-content-card__trait-list">
          {model.traits.map((trait) => (
            <li key={trait.id}>
              <strong>{trait.name}.</strong> {trait.description}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
