import type { ReviewBackgroundCardModel } from '../../../buildReviewSheetModels'

export function ReviewBackgroundCard({
  model,
  onEdit,
}: {
  model: ReviewBackgroundCardModel
  onEdit?: () => void
}) {
  return (
    <article
      className="review-content-card"
      aria-labelledby="review-background-heading"
    >
      <div className="review-content-card__header">
        <h3 id="review-background-heading" className="review-content-card__title">
          Background
        </h3>
        {onEdit !== undefined ? (
          <button type="button" className="review-sheet-section__edit" onClick={onEdit}>
            Edit
          </button>
        ) : null}
      </div>
      <p className="review-content-card__name">{model.name}</p>
      <p className="review-content-card__summary">{model.description}</p>
      <dl className="review-content-card__detail-list">
        {model.abilityScoreBenefits !== null ? (
          <div>
            <dt>Ability Scores</dt>
            <dd>{model.abilityScoreBenefits}</dd>
          </div>
        ) : null}
        {model.skillProficiencies.length > 0 ? (
          <div>
            <dt>Skills</dt>
            <dd>{model.skillProficiencies.join(', ')}</dd>
          </div>
        ) : null}
        {model.toolProficiency !== null ? (
          <div>
            <dt>Tool</dt>
            <dd>{model.toolProficiency}</dd>
          </div>
        ) : null}
        {model.originFeatName !== null ? (
          <div>
            <dt>Origin Feat</dt>
            <dd>{model.originFeatName}</dd>
          </div>
        ) : null}
        {model.otherBenefits.map((benefit) => (
          <div key={`${benefit.label}-${benefit.value}`}>
            <dt>{benefit.label}</dt>
            <dd>{benefit.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
