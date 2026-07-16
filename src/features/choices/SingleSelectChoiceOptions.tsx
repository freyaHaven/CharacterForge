import { useId } from 'react'
import type { ChoiceAccordionOption } from './ChoiceAccordion'

export type SingleSelectChoiceLayout = 'stack' | 'grid-2'

export type SingleSelectChoiceOptionsProps = {
  id: string
  options: readonly ChoiceAccordionOption[]
  selectedOptionId: string | null | undefined
  name: string
  onSelect: (optionId: string) => void
  /** `grid-2` shows a compact 2×2 card grid with descriptions on hover/focus. */
  layout?: SingleSelectChoiceLayout
}

export function SingleSelectChoiceOptions({
  id,
  options,
  selectedOptionId,
  name,
  onSelect,
  layout = 'stack',
}: SingleSelectChoiceOptionsProps) {
  const reactId = useId()
  const isGrid = layout === 'grid-2'

  return (
    <div
      className={
        isGrid
          ? 'choice-accordion__options choice-accordion__options--grid-2'
          : 'choice-accordion__options'
      }
    >
      {options.map((option) => {
        const inputId = `${id}-option-${option.id}-${reactId}`
        const descriptionId =
          option.description !== undefined && option.description.length > 0
            ? `${inputId}-description`
            : undefined

        return (
          <div
            key={option.id}
            className={
              isGrid
                ? 'choice-accordion__option choice-accordion__option--card'
                : 'choice-accordion__option'
            }
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={option.id}
              checked={selectedOptionId === option.id}
              aria-describedby={descriptionId}
              onChange={() => {
                onSelect(option.id)
              }}
            />
            <label htmlFor={inputId}>
              <span className="choice-accordion__option-label">
                {option.label}
              </span>
              {option.description ? (
                <span
                  id={descriptionId}
                  className={
                    isGrid
                      ? 'choice-accordion__option-description choice-accordion__option-description--hover'
                      : 'choice-accordion__option-description'
                  }
                >
                  {option.description}
                </span>
              ) : null}
            </label>
          </div>
        )
      })}
    </div>
  )
}
