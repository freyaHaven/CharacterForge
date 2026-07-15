import { useId, type ReactNode } from 'react'
import { SelectionCheckIcon } from '../species/SpeciesUiIcons'

export type CardSelectOption = {
  id: string
  label: string
  description?: string
  disabled?: boolean
  /** Reserved for future icon support. */
  icon?: ReactNode
}

export type SingleSelectCardGridProps = {
  id: string
  name: string
  options: readonly CardSelectOption[]
  selectedOptionId: string | null | undefined
  onSelect: (optionId: string) => void
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

type GridColumnCount = 1 | 2 | 3

function optionHasDescription(option: CardSelectOption): boolean {
  return (
    option.description !== undefined && option.description.trim().length > 0
  )
}

function getCardClassName(
  option: CardSelectOption,
  isSelected: boolean,
  isDisabled: boolean,
): string {
  const densityClass = optionHasDescription(option)
    ? 'card-select-choice__card--described'
    : 'card-select-choice__card--compact'

  if (isDisabled) {
    return `card-select-choice__card ${densityClass} card-select-choice__card--disabled`
  }

  if (isSelected) {
    return `card-select-choice__card ${densityClass} card-select-choice__card--selected`
  }

  return `card-select-choice__card ${densityClass}`
}

export function getCompactColumnCount(optionCount: number): GridColumnCount {
  if (optionCount <= 1) {
    return 1
  }

  if (optionCount === 9) {
    return 3
  }

  return 2
}

function getColumnClass(columnCount: GridColumnCount): string {
  return `card-select-choice__grid--cols-${columnCount}`
}

export function shouldSpanFullRow(
  optionIndex: number,
  optionCount: number,
): boolean {
  return (
    (optionCount === 5 && optionIndex === 4) ||
    (optionCount === 7 && optionIndex === 6)
  )
}

export function SingleSelectCardGrid({
  id,
  name,
  options,
  selectedOptionId,
  onSelect,
  ariaLabelledBy,
  ariaDescribedBy,
}: SingleSelectCardGridProps) {
  const reactId = useId()
  const hasDescribedOptions = options.some(optionHasDescription)
  const columnCount: GridColumnCount = hasDescribedOptions
    ? 1
    : getCompactColumnCount(options.length)
  const gridClassName = [
    'card-select-choice__grid',
    hasDescribedOptions
      ? 'card-select-choice__grid--described'
      : 'card-select-choice__grid--compact',
    getColumnClass(columnCount),
  ].join(' ')

  return (
    <div
      className={gridClassName}
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
    >
      {options.map((option, optionIndex) => {
        const inputId = `${id}-option-${option.id}-${reactId}`
        const isSelected = selectedOptionId === option.id
        const isDisabled = option.disabled === true
        const itemClassName = shouldSpanFullRow(optionIndex, options.length)
          ? 'card-select-choice__item card-select-choice__item--span-full'
          : 'card-select-choice__item'

        return (
          <div key={option.id} className={itemClassName}>
            <input
              id={inputId}
              className="sr-only card-select-choice__input"
              type="radio"
              name={name}
              value={option.id}
              checked={isSelected}
              disabled={isDisabled}
              onChange={() => {
                onSelect(option.id)
              }}
            />
            <label
              htmlFor={inputId}
              className={getCardClassName(option, isSelected, isDisabled)}
            >
              {isSelected ? (
                <span
                  className="card-select-choice__badge"
                  aria-hidden="true"
                >
                  <SelectionCheckIcon />
                </span>
              ) : null}
              {option.icon !== undefined ? (
                <span className="card-select-choice__icon" aria-hidden="true">
                  {option.icon}
                </span>
              ) : null}
              <span className="card-select-choice__text">
                <span className="card-select-choice__title">
                  {option.label}
                </span>
                {optionHasDescription(option) ? (
                  <span className="card-select-choice__description">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        )
      })}
    </div>
  )
}
