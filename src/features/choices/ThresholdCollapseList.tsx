import { useId, useState, type ReactNode } from 'react'
import { ChoiceChevronIcon } from './ChoiceChevronIcon'

/** Lists longer than this render as a collapsed accordion by default. */
export const THRESHOLD_COLLAPSE_DEFAULT = 3

export type ThresholdCollapseListProps = {
  /** Stable id prefix for header / panel ARIA relationships. */
  id: string
  /**
   * Accordion header label, e.g. "Always Prepared Spells · 5".
   * Only shown when the list is collapsed into an accordion.
   */
  title: string
  itemCount: number
  /** Collapse when itemCount exceeds this value. Defaults to 3. */
  threshold?: number
  /** Initial expanded state when collapsed into an accordion. Defaults to false. */
  defaultExpanded?: boolean
  children: ReactNode
}

/**
 * Renders children directly for short lists; wraps longer lists in a
 * choice-accordion disclosure so dense granted content stays scannable.
 */
export function ThresholdCollapseList({
  id,
  title,
  itemCount,
  threshold = THRESHOLD_COLLAPSE_DEFAULT,
  defaultExpanded = false,
  children,
}: ThresholdCollapseListProps) {
  const reactId = useId()
  const headerId = `${id}-header-${reactId}`
  const panelId = `${id}-panel-${reactId}`
  const [expanded, setExpanded] = useState(defaultExpanded)

  if (itemCount <= threshold) {
    return <>{children}</>
  }

  return (
    <div
      className={
        expanded
          ? 'choice-accordion choice-accordion--expanded threshold-collapse'
          : 'choice-accordion threshold-collapse'
      }
    >
      <button
        type="button"
        id={headerId}
        className="choice-accordion__header"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setExpanded((current) => !current)
        }}
      >
        <span className="choice-accordion__header-text">
          <span className="choice-accordion__title">{title}</span>
        </span>
        <span className="choice-accordion__chevron" aria-hidden="true">
          <ChoiceChevronIcon />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!expanded}
        className="choice-accordion__panel"
      >
        {children}
      </div>
    </div>
  )
}

export function formatThresholdCollapseTitle(
  label: string,
  progress: string | number,
): string {
  return `${label} · ${progress}`
}
