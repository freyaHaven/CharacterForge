import type { ReactNode } from 'react'
import type { AbilityId } from '../../domain/abilities/types'
import type { ClassChoice, ClassChoiceValue } from '../../domain/class/types'
import {
  ABILITY_ABBREVIATIONS,
  SKILL_ABILITY_MAP,
} from '../../domain/character/sheetMechanics'
import { isSkillId, SKILL_LABELS } from '../../domain/skills/types'
import {
  getWeaponMasteryPropertyLabel,
} from '../../domain/weapons/mastery'
import { isWeaponId, WEAPON_LABELS } from '../../domain/weapons/types'

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

function formatAbilityAbbreviation(abilityId: AbilityId): string {
  return ABILITY_ABBREVIATIONS[abilityId]
}

function renderOptionLabel(
  optionId: string,
  fallbackLabel: string,
): ReactNode {
  if (isSkillId(optionId)) {
    const abilityAbbr = formatAbilityAbbreviation(SKILL_ABILITY_MAP[optionId])

    return (
      <>
        {SKILL_LABELS[optionId]}{' '}
        <span className="class-picker__choice-meta">({abilityAbbr})</span>
      </>
    )
  }

  if (isWeaponId(optionId)) {
    return (
      <>
        {WEAPON_LABELS[optionId]}{' '}
        <span className="class-picker__choice-meta">
          ({getWeaponMasteryPropertyLabel(optionId)})
        </span>
      </>
    )
  }

  return fallbackLabel || optionId
}

function renderHoverDescription(description: string): ReactNode {
  const separatorIndex = description.indexOf('. ')

  if (separatorIndex === -1) {
    return description
  }

  const title = description.slice(0, separatorIndex)
  const body = description.slice(separatorIndex + 2)

  return (
    <>
      <em className="class-picker__choice-hover-title">{title}.</em> {body}
    </>
  )
}

export type ClassMultiSelectChoiceFieldProps = {
  choice: Extract<ClassChoice, { type: 'multi-select' }>
  value: ClassChoiceValue | undefined
  errorId: string | undefined
  /** Visible legend. Prefer omitting when the accordion title already explains the choice. */
  legend?: string
  /** Accessible name when no visible legend is shown. */
  ariaLabel?: string
  labelledBy?: string
  /** Option ids selected in related choices (e.g. other Weapon Mastery rows). */
  excludedOptionIds?: readonly string[]
  /** Option ids that fail prerequisites — shown disabled with a reason. */
  ineligibleOptionIds?: ReadonlyMap<string, string>
  onChange: (choiceId: string, value: ClassChoiceValue | undefined) => void
}

export function ClassMultiSelectChoiceField({
  choice,
  value,
  errorId,
  legend,
  ariaLabel,
  labelledBy,
  excludedOptionIds = [],
  ineligibleOptionIds,
  onChange,
}: ClassMultiSelectChoiceFieldProps) {
  const selectedOptionIds = getSelectedOptionIds(value)
  const excluded = new Set(excludedOptionIds)
  const visibleOptions = choice.options.filter(
    (option) => !excluded.has(option.id),
  )
  const hasHoverDescriptions = visibleOptions.some(
    (option) =>
      typeof option.description === 'string' && option.description.length > 0,
  )

  return (
    <fieldset
      className="class-picker__choice-fieldset"
      aria-describedby={errorId}
      aria-labelledby={labelledBy}
      aria-label={labelledBy === undefined && legend === undefined ? ariaLabel : undefined}
    >
      {legend !== undefined ? <legend>{legend}</legend> : null}
      <div
        className={
          hasHoverDescriptions
            ? 'class-picker__choice-options class-picker__choice-options--multi class-picker__choice-options--hoverable'
            : 'class-picker__choice-options class-picker__choice-options--multi'
        }
      >
        {visibleOptions.map((option) => {
          const inputId = `class-choice-${choice.id}-${option.id}`
          const isChecked = selectedOptionIds.includes(option.id)
          const ineligibleReason = ineligibleOptionIds?.get(option.id)
          const isIneligible = ineligibleReason !== undefined && !isChecked
          const isDisabled =
            isIneligible ||
            (!isChecked && selectedOptionIds.length >= choice.max)
          const descriptionId =
            option.description !== undefined && option.description.length > 0
              ? `${inputId}-description`
              : undefined
          const reasonId =
            isIneligible && ineligibleReason !== undefined
              ? `${inputId}-ineligible`
              : undefined

          return (
            <div
              key={option.id}
              className={
                descriptionId !== undefined || reasonId !== undefined
                  ? 'class-picker__choice-option class-picker__choice-option--hoverable'
                  : 'class-picker__choice-option'
              }
            >
              <input
                id={inputId}
                type="checkbox"
                name={`class-choice-${choice.id}`}
                value={option.id}
                checked={isChecked}
                disabled={isDisabled}
                aria-describedby={[descriptionId, reasonId]
                  .filter(Boolean)
                  .join(' ') || undefined}
                onChange={() => {
                  onChange(
                    choice.id,
                    toggleMultiSelectOption(value, option.id, choice.max),
                  )
                }}
              />
              <label htmlFor={inputId}>
                <span className="class-picker__choice-label">
                  {renderOptionLabel(option.id, option.label)}
                </span>
              </label>
              {isIneligible && ineligibleReason !== undefined ? (
                <span
                  id={reasonId}
                  className="class-picker__choice-hover-description"
                  role="tooltip"
                >
                  {ineligibleReason}
                </span>
              ) : option.description !== undefined &&
                option.description.length > 0 ? (
                <span
                  id={descriptionId}
                  className="class-picker__choice-hover-description"
                  role="tooltip"
                >
                  {renderHoverDescription(option.description)}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
