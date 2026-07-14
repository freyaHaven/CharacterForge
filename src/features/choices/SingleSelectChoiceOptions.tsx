import { useId } from 'react'
import type { ChoiceAccordionOption } from './ChoiceAccordion'

export type SingleSelectChoiceOptionsProps = {
  id: string
  options: readonly ChoiceAccordionOption[]
  selectedOptionId: string | null | undefined
  name: string
  onSelect: (optionId: string) => void
}

export function SingleSelectChoiceOptions({
  id,
  options,
  selectedOptionId,
  name,
  onSelect,
}: SingleSelectChoiceOptionsProps) {
  const reactId = useId()

  return (
    <>
      {options.map((option) => {
        const inputId = `${id}-option-${option.id}-${reactId}`

        return (
          <div key={option.id} className="choice-accordion__option">
            <input
              id={inputId}
              type="radio"
              name={name}
              value={option.id}
              checked={selectedOptionId === option.id}
              onChange={() => {
                onSelect(option.id)
              }}
            />
            <label htmlFor={inputId}>
              <span className="choice-accordion__option-label">
                {option.label}
              </span>
              {option.description ? (
                <span className="choice-accordion__option-description">
                  {option.description}
                </span>
              ) : null}
            </label>
          </div>
        )
      })}
    </>
  )
}
