import type { FinishPolicyResult } from '../../characterFinishPolicy'
import type {
  CharacterDetailsReviewSections,
  ReviewableStepId,
} from '../../reviewSummary'
import {
  formatReviewStatusLabel,
  getReviewStepLabel,
  hasCharacterDetailsReviewContent,
} from '../../reviewSummary'
import { CharacterDetailsReviewContent } from '../../../features/character-details/CharacterDetailsReviewContent'
import type { StepStatus } from '../types'

type ReviewSummaryCardProps = {
  stepId: ReviewableStepId
  status: StepStatus
  summaryLines: string[]
  characterDetailsReview?: CharacterDetailsReviewSections
  onEdit: (stepId: ReviewableStepId) => void
}

function ReviewSummaryCard({
  stepId,
  status,
  summaryLines,
  characterDetailsReview,
  onEdit,
}: ReviewSummaryCardProps) {
  const label = getReviewStepLabel(stepId)
  const headingId = `review-summary-${stepId}-heading`
  const statusLabel = formatReviewStatusLabel(status)

  if (
    stepId === 'character-details' &&
    (characterDetailsReview === undefined
      ? summaryLines.length === 0
      : !hasCharacterDetailsReviewContent(characterDetailsReview))
  ) {
    return null
  }

  return (
    <section
      aria-labelledby={headingId}
      className={[
        'review-summary-card',
        status.hasValidationErrors ? 'review-summary-card--warning' : '',
        status.completion === 'complete'
          ? 'review-summary-card--complete'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="review-summary-card__header">
        <h3 id={headingId}>{label}</h3>
        <p className="review-summary-card__status">
          Status: {statusLabel}
          {status.hasValidationErrors ? (
            <span className="review-summary-card__warning">Needs attention</span>
          ) : null}
        </p>
      </div>

      {stepId === 'character-details' && characterDetailsReview !== undefined ? (
        <CharacterDetailsReviewContent sections={characterDetailsReview} />
      ) : (
        <ul className="review-summary-card__details">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => onEdit(stepId)}>
        Edit {label}
      </button>
    </section>
  )
}

export type ReviewStepProps = {
  reviewableStepIds: ReviewableStepId[]
  stepStatuses: Record<ReviewableStepId, StepStatus>
  summaries: Record<ReviewableStepId, string[]>
  characterDetailsReview: CharacterDetailsReviewSections
  finishPolicy: FinishPolicyResult
  finishBlockedMessage: string
  finishMessage: string | null
  onEditStep: (stepId: ReviewableStepId) => void
  onFinish: () => void
}

export function ReviewStep({
  reviewableStepIds,
  stepStatuses,
  summaries,
  characterDetailsReview,
  finishPolicy,
  finishBlockedMessage,
  finishMessage,
  onEditStep,
  onFinish,
}: ReviewStepProps) {
  return (
    <section
      aria-labelledby="wizard-step-review-heading"
      className="wizard-step-panel review-step"
    >
      <h2 id="wizard-step-review-heading">Review</h2>
      <p className="review-step__intro">
        Check each step below. Use Edit to jump back to any section, then finish
        when your required choices are complete.
      </p>

      <div className="review-step__summaries">
        {reviewableStepIds.map((stepId) => (
          <ReviewSummaryCard
            key={stepId}
            stepId={stepId}
            status={stepStatuses[stepId]}
            summaryLines={summaries[stepId]}
            characterDetailsReview={
              stepId === 'character-details' ? characterDetailsReview : undefined
            }
            onEdit={onEditStep}
          />
        ))}
      </div>

      <div className="review-step__finish">
        <button
          type="button"
          disabled={!finishPolicy.canFinish}
          onClick={onFinish}
        >
          Finish character
        </button>
        {!finishPolicy.canFinish ? (
          <p className="review-step__finish-hint" role="status">
            {finishBlockedMessage}
          </p>
        ) : null}
        {finishMessage !== null ? (
          <p className="review-step__finish-message" role="status" aria-live="polite">
            {finishMessage}
          </p>
        ) : null}
      </div>
    </section>
  )
}
