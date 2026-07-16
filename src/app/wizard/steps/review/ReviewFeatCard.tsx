import type { ReviewFeatCardModel } from '../../../buildReviewSheetModels'

export function ReviewFeatCard({
  model,
  onEdit,
}: {
  model: ReviewFeatCardModel
  onEdit?: () => void
}) {
  return (
    <article className="review-content-card" aria-labelledby="review-feat-heading">
      <div className="review-content-card__header">
        <h3 id="review-feat-heading" className="review-content-card__title">
          Feats
        </h3>
        {onEdit !== undefined ? (
          <button type="button" className="review-sheet-section__edit" onClick={onEdit}>
            Edit
          </button>
        ) : null}
      </div>
      <p className="review-content-card__name">{model.name}</p>
      <p className="review-content-card__summary">{model.description}</p>
      {model.prerequisite !== null ? (
        <p className="review-content-card__prerequisite">
          Prerequisite: {model.prerequisite}
        </p>
      ) : null}
      {model.choices.length > 0 ? (
        <dl className="review-content-card__detail-list">
          {model.choices.map((choice) => (
            <div key={`${choice.prompt}-${choice.summary}`}>
              <dt>{choice.prompt}</dt>
              <dd>{choice.summary}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  )
}
