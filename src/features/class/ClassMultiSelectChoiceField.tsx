import type { ClassChoice, ClassChoiceValue } from '../../domain/class/types'
import { SKILL_LABELS } from '../../domain/skills/types'

function getSelectedOptionIds(value: ClassChoiceValue | undefined): string[] {
  if (value === undefined) {
    return []
  }

  return typeof value === 'string' ? [value] : [...value]
}

function toggleMultiSelectOption(
  current: ClassChoiceValue | undefined,
  optionId: string,
  max: number,
): ClassChoiceValue {
  const selected = getSelectedOptionIds(current)

  if (selected.includes(optionId)) {
    return selected.filter((entry) => entry !== optionId)
  }

  if (selected.length >= max) {
    return selected
  }

  return [...selected, optionId]
}

export type ClassMultiSelectChoiceFieldProps = {
  choice: Extract<ClassChoice, { type: 'multi-select' }>
  value: ClassChoiceValue | undefined
  errorId: string | undefined
  legend?: string
  labelledBy?: string
  onChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
}

export function ClassMultiSelectChoiceField({
  choice,
  value,
  errorId,
  legend,
  labelledBy,
  onChange,
}: ClassMultiSelectChoiceFieldProps) {
  const selectedOptionIds = getSelectedOptionIds(value)

  return (
    <fieldset
      className="class-picker__choice-fieldset"
      aria-describedby={errorId}
      aria-labelledby={labelledBy}
    >
      {legend !== undefined ? <legend>{legend}</legend> : null}
      <p className="class-picker__choice-count" aria-live="polite">
        Selected {selectedOptionIds.length} of {choice.max}
      </p>
      <div className="class-picker__choice-options class-picker__choice-options--multi">
        {choice.options.map((option) => {
          const inputId = `class-choice-${choice.id}-${option.id}`
          const isChecked = selectedOptionIds.includes(option.id)
          const isDisabled =
            !isChecked && selectedOptionIds.length >= choice.max

          return (
            <div key={option.id} className="class-picker__choice-option">
              <input
                id={inputId}
                type="checkbox"
                name={`class-choice-${choice.id}`}
                value={option.id}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => {
                  onChange(
                    choice.id,
                    toggleMultiSelectOption(value, option.id, choice.max),
                  )
                }}
              />
              <label htmlFor={inputId}>
                <span className="class-picker__choice-label">
                  {option.label ||
                    (option.id in SKILL_LABELS
                      ? SKILL_LABELS[option.id as keyof typeof SKILL_LABELS]
                      : option.id)}
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
