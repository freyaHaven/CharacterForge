import { useId } from 'react'
import { ChoiceChevronIcon } from './ChoiceChevronIcon'
import { SingleSelectChoiceOptions } from './SingleSelectChoiceOptions'
import {
  getSelectedOptionLabel,
  useExpandableSingleSelectChoice,
} from './useExpandableSingleSelectChoice'

export type ChoiceAccordionOption = {
  id: string
  label: string
  description?: string
}

export type ChoiceAccordionProps = {
  id: string
  title: string
  options: readonly ChoiceAccordionOption[]
  selectedOptionId: string | null | undefined
  emptySelectionLabel?: string
  name: string
  describedBy?: string
  defaultExpanded?: boolean
  onSelect: (optionId: string) => void
}

export function ChoiceAccordion({
  id,
  title,
  options,
  selectedOptionId,
  emptySelectionLabel = 'No selection',
  name,
  describedBy,
  defaultExpanded,
  onSelect,
}: ChoiceAccordionProps) {
  const reactId = useId()
  const headerId = `${id}-header-${reactId}`
  const panelId = `${id}-panel-${reactId}`
  const titleId = `${headerId}-title`
  const summaryId = `${headerId}-summary`

  const { isExpanded, toggleExpanded, handleSelect } =
    useExpandableSingleSelectChoice({
      selectedOptionId,
      defaultExpanded,
      onSelect,
    })

  const summaryLabel =
    getSelectedOptionLabel(options, selectedOptionId) ?? emptySelectionLabel

  return (
    <div
      className={
        isExpanded
          ? 'choice-accordion choice-accordion--expanded'
          : 'choice-accordion'
      }
    >
      <button
        type="button"
        id={headerId}
        className="choice-accordion__header"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-describedby={describedBy}
        onClick={toggleExpanded}
      >
        <span className="choice-accordion__header-text">
          <span id={titleId} className="choice-accordion__title">
            {title}
          </span>
          <span id={summaryId} className="choice-accordion__summary">
            {summaryLabel}
          </span>
        </span>
        <span className="choice-accordion__chevron" aria-hidden="true">
          <ChoiceChevronIcon />
        </span>
      </button>

      <div
        id={panelId}
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        hidden={!isExpanded}
        className="choice-accordion__panel"
      >
        <SingleSelectChoiceOptions
          id={id}
          options={options}
          selectedOptionId={selectedOptionId}
          name={name}
          onSelect={handleSelect}
        />
      </div>
    </div>
  )
}
