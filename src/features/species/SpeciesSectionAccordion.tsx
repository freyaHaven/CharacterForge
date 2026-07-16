import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ChoiceChevronIcon } from '../choices/ChoiceChevronIcon'
import { SystemIcon } from '../system/SystemIcon'

export type SpeciesSectionCompletion = 'complete' | 'incomplete' | 'granted'

export type SpeciesSectionAccordionProps = {
  title: string
  metaParts?: readonly string[]
  completion: SpeciesSectionCompletion
  completionLabel: string
  defaultExpanded?: boolean
  children: ReactNode
}

export function SpeciesSectionAccordion({
  title,
  metaParts = [],
  completion,
  completionLabel,
  defaultExpanded = false,
  children,
}: SpeciesSectionAccordionProps) {
  const reactId = useId()
  const panelId = `species-section-panel-${reactId}`
  const titleId = `species-section-title-${reactId}`
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const metaText = metaParts.filter(Boolean).join(' • ')
  const showWarning = completion === 'incomplete'

  return (
    <section
      className={
        isExpanded
          ? 'species-picker__section-accordion species-picker__section-accordion--expanded'
          : 'species-picker__section-accordion'
      }
      data-completion={completion}
    >
      <button
        type="button"
        className="species-picker__section-accordion-trigger"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => {
          setIsExpanded((current) => !current)
        }}
      >
        <span className="species-picker__section-accordion-main">
          <span id={titleId} className="species-picker__section-accordion-title">
            {title}
          </span>
          {metaText.length > 0 ? (
            <span className="species-picker__section-accordion-meta">
              {metaText}
            </span>
          ) : null}
        </span>
        <span
          className="species-picker__section-accordion-status"
          data-completion={completion}
        >
          {showWarning ? (
            <SystemIcon
              name="warning"
              size={50}
              className="species-picker__section-accordion-warning"
              alt={completionLabel}
            />
          ) : (
            completionLabel
          )}
        </span>
        <span
          className="species-picker__section-accordion-chevron"
          aria-hidden="true"
        >
          <ChoiceChevronIcon />
        </span>
      </button>

      <div
        id={panelId}
        className="species-picker__section-accordion-panel"
        role="region"
        aria-labelledby={titleId}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </section>
  )
}
