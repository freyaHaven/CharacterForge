import { useId } from 'react'
import type { AbilityId } from '../../domain/abilities/types'
import {
  ALL_ABILITY_OPTIONS,
  ASI_CHOICE_OPTIONS,
  getAsiMode,
  isAsiMode,
  parseAsiChoice,
  selectAsiMode,
  selectAsiPlus1Plus1,
  selectAsiPlus2,
  type AsiMode,
} from '../../domain/class/abilityScoreImprovement'
import {
  listFeatChoiceOptions,
} from '../../domain/feat/validateFeatChoices'
import {
  getSkillOrToolProficiencyOption,
} from '../../domain/feat/skillOrToolProficiency'
import type { FeatDefinition } from '../../domain/feat/types'
import { formatAbilityLabel } from '../class/formatClassDetails'

export type FeatSubChoicesFieldsProps = {
  definition: FeatDefinition
  choices: Record<string, string | string[]>
  ownedSkillIds: ReadonlySet<string>
  ownedToolIds: ReadonlySet<string>
  onChange: (choiceId: string, value: string | string[] | undefined) => void
}

function getSelectedIds(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return []
  }
  return typeof value === 'string' ? [value] : [...value]
}

function toggleMultiSelect(
  current: string | string[] | undefined,
  optionId: string,
  max: number,
): string[] {
  const selected = getSelectedIds(current)
  if (selected.includes(optionId)) {
    return selected.filter((entry) => entry !== optionId)
  }
  if (selected.length >= max) {
    return selected
  }
  return [...selected, optionId]
}

function AsiScoreIncreaseFields({
  choiceId,
  value,
  onChange,
}: {
  choiceId: string
  value: string | undefined
  onChange: (choiceId: string, value: string) => void
}) {
  const reactId = useId()
  const mode = getAsiMode(value)
  const parsed = typeof value === 'string' ? parseAsiChoice(value) : null
  const plus2Ability = parsed?.kind === 'plus-2' ? parsed.abilityId : null
  const plus1Abilities = parsed?.kind === 'plus-1-1' ? parsed.abilityIds : null

  // Cycle guard: only plus-2 / plus-1-1 — never nested feat mode.
  const scoreModes = ASI_CHOICE_OPTIONS.filter((option) => option.id !== 'feat')

  const handleModeChange = (nextMode: AsiMode) => {
    if (nextMode === 'feat') {
      return
    }
    onChange(choiceId, selectAsiMode(nextMode))
  }

  return (
    <div className="class-picker__asi-choice">
      <div
        className="choice-accordion__options"
        role="radiogroup"
        aria-label="Ability Score Improvement"
      >
        {scoreModes.map((option) => {
          const inputId = `${choiceId}-mode-${option.id}-${reactId}`
          return (
            <div key={option.id} className="choice-accordion__option">
              <input
                id={inputId}
                type="radio"
                name={`${choiceId}-mode-${reactId}`}
                value={option.id}
                checked={mode === option.id}
                onChange={() => {
                  if (isAsiMode(option.id)) {
                    handleModeChange(option.id)
                  }
                }}
              />
              <label htmlFor={inputId}>
                <span className="choice-accordion__option-label">
                  {option.label}
                </span>
              </label>
            </div>
          )
        })}
      </div>

      {mode === 'plus-2' ? (
        <div
          className="class-picker__asi-detail choice-accordion__options"
          role="radiogroup"
          aria-label="Ability score to increase by 2"
        >
          {ALL_ABILITY_OPTIONS.map((abilityId) => {
            const inputId = `${choiceId}-plus2-${abilityId}-${reactId}`
            return (
              <div key={abilityId} className="choice-accordion__option">
                <input
                  id={inputId}
                  type="radio"
                  name={`${choiceId}-plus2-${reactId}`}
                  value={abilityId}
                  checked={plus2Ability === abilityId}
                  onChange={() => {
                    onChange(choiceId, selectAsiPlus2(abilityId))
                  }}
                />
                <label htmlFor={inputId}>
                  <span className="choice-accordion__option-label">
                    {formatAbilityLabel(abilityId)}
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      ) : null}

      {mode === 'plus-1-1' ? (
        <div className="class-picker__asi-detail class-picker__asi-plus-one-pair">
          <label className="field">
            <span>First ability (+1)</span>
            <select
              value={plus1Abilities?.[0] ?? ''}
              onChange={(event) => {
                const first = event.target.value as AbilityId
                const second =
                  plus1Abilities?.[1] !== undefined &&
                  plus1Abilities[1] !== first
                    ? plus1Abilities[1]
                    : (ALL_ABILITY_OPTIONS.find((id) => id !== first) ??
                      'dexterity')
                onChange(choiceId, selectAsiPlus1Plus1(first, second))
              }}
            >
              <option value="" disabled>
                Choose ability
              </option>
              {ALL_ABILITY_OPTIONS.map((abilityId) => (
                <option key={abilityId} value={abilityId}>
                  {formatAbilityLabel(abilityId)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Second ability (+1)</span>
            <select
              value={plus1Abilities?.[1] ?? ''}
              onChange={(event) => {
                const second = event.target.value as AbilityId
                const first =
                  plus1Abilities?.[0] !== undefined &&
                  plus1Abilities[0] !== second
                    ? plus1Abilities[0]
                    : (ALL_ABILITY_OPTIONS.find((id) => id !== second) ??
                      'strength')
                onChange(choiceId, selectAsiPlus1Plus1(first, second))
              }}
            >
              <option value="" disabled>
                Choose ability
              </option>
              {ALL_ABILITY_OPTIONS.map((abilityId) => (
                <option
                  key={abilityId}
                  value={abilityId}
                  disabled={abilityId === plus1Abilities?.[0]}
                >
                  {formatAbilityLabel(abilityId)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
    </div>
  )
}

export function FeatSubChoicesFields({
  definition,
  choices,
  ownedSkillIds,
  ownedToolIds,
  onChange,
}: FeatSubChoicesFieldsProps) {
  if (definition.choices.length === 0) {
    return null
  }

  return (
    <div className="feat-sub-choices">
      {definition.choices.map((choice) => {
        if (choice.type === 'asi-score-increase') {
          const value = choices[choice.id]
          return (
            <div key={choice.id} className="feat-sub-choices__block">
              <p className="feat-sub-choices__prompt">{choice.prompt}</p>
              <AsiScoreIncreaseFields
                choiceId={choice.id}
                value={typeof value === 'string' ? value : undefined}
                onChange={(choiceId, next) => {
                  onChange(choiceId, next)
                }}
              />
            </div>
          )
        }

        if (choice.type === 'multi-select') {
          const selected = getSelectedIds(choices[choice.id])
          const options = listFeatChoiceOptions(choice)

          return (
            <fieldset key={choice.id} className="class-picker__choice-fieldset">
              <legend>{choice.prompt}</legend>
              <div className="class-picker__choice-options class-picker__choice-options--multi">
                {options.map((option) => {
                  const inputId = `feat-choice-${choice.id}-${option.id}`
                  const parsed = getSkillOrToolProficiencyOption(option.id)
                  const alreadyOwned =
                    parsed?.kind === 'skill'
                      ? ownedSkillIds.has(parsed.targetId)
                      : parsed?.kind === 'tool'
                        ? ownedToolIds.has(parsed.targetId)
                        : false
                  const isChecked = selected.includes(option.id)
                  const isDisabled =
                    alreadyOwned ||
                    (!isChecked && selected.length >= choice.max)

                  return (
                    <div
                      key={option.id}
                      className="class-picker__choice-option"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        name={`feat-choice-${choice.id}`}
                        value={option.id}
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => {
                          if (alreadyOwned) {
                            return
                          }
                          onChange(
                            choice.id,
                            toggleMultiSelect(
                              choices[choice.id],
                              option.id,
                              choice.max,
                            ),
                          )
                        }}
                      />
                      <label htmlFor={inputId}>
                        <span className="class-picker__choice-label">
                          {option.label}
                          {alreadyOwned ? ' (already proficient)' : ''}
                        </span>
                      </label>
                    </div>
                  )
                })}
              </div>
            </fieldset>
          )
        }

        // single-select
        const selectedId =
          typeof choices[choice.id] === 'string'
            ? (choices[choice.id] as string)
            : null
        return (
          <div
            key={choice.id}
            className="class-picker__choice-options"
            role="radiogroup"
            aria-label={choice.prompt}
          >
            {choice.options.map((option) => {
              const inputId = `feat-choice-${choice.id}-${option.id}`
              return (
                <div key={option.id} className="class-picker__choice-option">
                  <input
                    id={inputId}
                    type="radio"
                    name={`feat-choice-${choice.id}`}
                    value={option.id}
                    checked={selectedId === option.id}
                    onChange={() => {
                      onChange(choice.id, option.id)
                    }}
                  />
                  <label htmlFor={inputId}>
                    <span className="class-picker__choice-label">
                      {option.label}
                    </span>
                  </label>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
