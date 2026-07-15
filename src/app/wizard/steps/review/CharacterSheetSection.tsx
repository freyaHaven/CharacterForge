import type { ReactNode } from 'react'
import type { ReviewableStepId } from '../../../reviewSummary'
import type { StepStatus } from '../../types'
import { formatReviewStatusLabel } from '../../../reviewSummary'

export type CharacterSheetSectionProps = {
  id: string
  title: string
  icon?: ReactNode
  status?: StepStatus
  editStepId?: ReviewableStepId
  onEdit?: (stepId: ReviewableStepId) => void
  children: ReactNode
}

export function CharacterSheetSection({
  id,
  title,
  icon,
  status,
  editStepId,
  onEdit,
  children,
}: CharacterSheetSectionProps) {
  const headingId = `${id}-heading`
  const showStatus = status !== undefined && status.completion !== 'complete'
  const hasWarning = status?.hasValidationErrors === true

  return (
    <section
      className={[
        'review-sheet-section',
        hasWarning ? 'review-sheet-section--warning' : '',
        status?.completion === 'complete' ? 'review-sheet-section--complete' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={headingId}
    >
      <div className="review-sheet-section__header">
        <div className="review-sheet-section__title-row">
          {icon !== undefined ? (
            <span className="review-sheet-section__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <h3 id={headingId} className="review-sheet-section__title">
            {title}
          </h3>
          {showStatus ? (
            <span
              className={[
                'review-sheet-section__badge',
                hasWarning ? 'review-sheet-section__badge--warning' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {hasWarning ? 'Needs attention' : formatReviewStatusLabel(status!)}
            </span>
          ) : null}
        </div>

        {editStepId !== undefined && onEdit !== undefined ? (
          <button
            type="button"
            className="review-sheet-section__edit"
            onClick={() => onEdit(editStepId)}
          >
            Edit
          </button>
        ) : null}
      </div>

      <div className="review-sheet-section__body">{children}</div>
    </section>
  )
}
