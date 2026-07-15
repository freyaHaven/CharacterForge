import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ChoiceChevronIcon } from '../choices/ChoiceChevronIcon'

type ClassLevelAccordionProps = {
  level: number
  defaultExpanded?: boolean
  children: ReactNode
}

export function ClassLevelAccordion({
  level,
  defaultExpanded = true,
  children,
}: ClassLevelAccordionProps) {
  const reactId = useId()
  const panelId = `class-level-panel-${level}-${reactId}`
  const titleId = `class-level-title-${level}-${reactId}`
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <section
      className={
        isExpanded
          ? 'class-picker__level-accordion class-picker__level-accordion--expanded'
          : 'class-picker__level-accordion'
      }
    >
      <div className="class-picker__level-accordion-header">
        <button
          type="button"
          className="class-picker__level-accordion-trigger"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-labelledby={titleId}
          onClick={() => {
            setIsExpanded((current) => !current)
          }}
        >
          <span className="class-picker__level-accordion-chevron" aria-hidden="true">
            <ChoiceChevronIcon />
          </span>
        </button>
        <h5 id={titleId} className="class-picker__feature-level-title">
          Level {level}
        </h5>
      </div>

      <div
        id={panelId}
        className="class-picker__level-accordion-panel"
        hidden={!isExpanded}
      >
        {children}
      </div>
    </section>
  )
}
