import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ChoiceChevronIcon } from '../choices/ChoiceChevronIcon'
import { SystemIcon } from '../system/SystemIcon'
import type { ClassFeatureCompletionState } from './buildClassFeatureAccordionItems'

export type ClassFeatureAccordionProps = {
  title: string
  metaParts: readonly string[]
  completion: ClassFeatureCompletionState
  completionLabel: string
  defaultExpanded?: boolean
  children: ReactNode
}

export function ClassFeatureAccordion({
  title,
  metaParts,
  completion,
  completionLabel,
  defaultExpanded = false,
  children,
}: ClassFeatureAccordionProps) {
  const reactId = useId()
  const panelId = `class-feature-panel-${reactId}`
  const titleId = `class-feature-title-${reactId}`
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const metaText = metaParts.filter(Boolean).join(' • ')
  const showWarning = completion === 'incomplete'

  return (
    <section
      className={
        isExpanded
          ? 'class-picker__feature-accordion class-picker__feature-accordion--expanded'
          : 'class-picker__feature-accordion'
      }
      data-completion={completion}
    >
      <button
        type="button"
        className="class-picker__feature-accordion-trigger"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => {
          setIsExpanded((current) => !current)
        }}
      >
        <span className="class-picker__feature-accordion-main">
          <span id={titleId} className="class-picker__feature-accordion-title">
            {title}
          </span>
          {metaText.length > 0 ? (
            <span className="class-picker__feature-accordion-meta">{metaText}</span>
          ) : null}
        </span>
        <span
          className="class-picker__feature-accordion-status"
          data-completion={completion}
        >
          {showWarning ? (
            <SystemIcon
              name="warning"
              size={50}
              className="class-picker__feature-accordion-warning"
              alt={completionLabel}
            />
          ) : (
            completionLabel
          )}
        </span>
        <span
          className="class-picker__feature-accordion-chevron"
          aria-hidden="true"
        >
          <ChoiceChevronIcon />
        </span>
      </button>

      <div
        id={panelId}
        className="class-picker__feature-accordion-panel"
        role="region"
        aria-labelledby={titleId}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </section>
  )
}
