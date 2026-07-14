import { useId } from 'react'
import { ChoiceChevronIcon } from './ChoiceChevronIcon'
import type { ChoiceAccordionOption } from './ChoiceAccordion'
import { SingleSelectChoiceOptions } from './SingleSelectChoiceOptions'
import {
  getSelectedOption,
  useExpandableSingleSelectChoice,
} from './useExpandableSingleSelectChoice'

export type FeatureChoiceCardProps = {
  id: string
  title: string
  description: string
  options: readonly ChoiceAccordionOption[]
  selectedOptionId: string | null | undefined
  emptySelectionLabel?: string
  name: string
  describedBy?: string
  defaultExpanded?: boolean
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onSelect: (optionId: string) => void
}

export function FeatureChoiceCard({
  id,
  title,
  description,
  options,
  selectedOptionId,
  emptySelectionLabel = 'No selection',
  name,
  describedBy,
  defaultExpanded,
  expanded,
  onExpandedChange,
  onSelect,
}: FeatureChoiceCardProps) {
  const reactId = useId()
  const headerId = `${id}-header-${reactId}`
  const panelId = `${id}-panel-${reactId}`
  const titleId = `${headerId}-title`

  const { isExpanded, toggleExpanded, handleSelect } =
    useExpandableSingleSelectChoice({
      selectedOptionId,
      defaultExpanded,
      expanded,
      onExpandedChange,
      onSelect,
    })

  const selectedOption = getSelectedOption(options, selectedOptionId)
  const selectionSummary =
    selectedOption === null
      ? emptySelectionLabel
      : `Selected: ${selectedOption.label}`

  return (
    <article
      className={
        isExpanded
          ? 'feature-choice-card feature-choice-card--expanded'
          : 'feature-choice-card'
      }
    >
      <div className="feature-choice-card__header-row">
        <button
          type="button"
          id={headerId}
          className="feature-choice-card__header"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-describedby={describedBy}
          onClick={toggleExpanded}
        >
          <span id={titleId} className="feature-choice-card__title">
            {title}
          </span>
          <span className="feature-choice-card__chevron" aria-hidden="true">
            <ChoiceChevronIcon />
          </span>
        </button>
      </div>

      <p className="feature-choice-card__description">{description}</p>

      {!isExpanded ? (
        <div className="feature-choice-card__selection-summary">
          <p className="feature-choice-card__selection-label">
            {selectionSummary}
          </p>
          {selectedOption?.description ? (
            <p className="feature-choice-card__selection-description">
              {selectedOption.description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        id={panelId}
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        hidden={!isExpanded}
        className="feature-choice-card__options"
      >
        <SingleSelectChoiceOptions
          id={id}
          options={options}
          selectedOptionId={selectedOptionId}
          name={name}
          onSelect={handleSelect}
        />
      </div>
    </article>
  )
}
