import type { FinishPolicyResult } from '../../characterFinishPolicy'
import type { ReviewableStepId } from '../../reviewSummary'
import {
  formatReviewStatusLabel,
  getReviewStepLabel,
  REVIEWABLE_STEP_IDS,
} from '../../reviewSummary'
import type { StepStatus } from '../types'

type ReviewSummaryCardProps = {
  stepId: ReviewableStepId
  status: StepStatus
  summaryLines: string[]
  onEdit: (stepId: ReviewableStepId) => void
}

function ReviewSummaryCard({
  stepId,
  status,
  summaryLines,
  onEdit,
}: ReviewSummaryCardProps) {
  const label = getReviewStepLabel(stepId)
  const headingId = `review-summary-${stepId}-heading`
  const statusLabel = formatReviewStatusLabel(status)

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

      <ul className="review-summary-card__details">
        {summaryLines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <button type="button" onClick={() => onEdit(stepId)}>
        Edit {label}
      </button>
    </section>
  )
}

export type ReviewStepProps = {
  stepStatuses: Record<ReviewableStepId, StepStatus>
  summaries: Record<ReviewableStepId, string[]>
  finishPolicy: FinishPolicyResult
  finishBlockedMessage: string
  finishMessage: string | null
  onEditStep: (stepId: ReviewableStepId) => void
  onFinish: () => void
}

export function ReviewStep({
  stepStatuses,
  summaries,
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
        {REVIEWABLE_STEP_IDS.map((stepId) => (
          <ReviewSummaryCard
            key={stepId}
            stepId={stepId}
            status={stepStatuses[stepId]}
            summaryLines={summaries[stepId]}
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
