import { useEffect, useId, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatDefinition } from '../../domain/feat/types'
import {
  ALL_ABILITY_OPTIONS,
  ASI_CHOICE_OPTIONS,
  getAsiMode,
  isAsiMode,
  parseAsiChoice,
  selectAsiFeat,
  selectAsiMode,
  selectAsiPlus1Plus1,
  selectAsiPlus2,
  type AsiMode,
} from '../../domain/class/abilityScoreImprovement'
import { isFeatExcludedFromAsiFeatModePicker } from '../../domain/class/epicBoon'
import { formatAbilityLabel } from './formatClassDetails'
import type { AbilityId } from '../../domain/abilities/types'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

export type AsiChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  /** Feat ids already taken by other ASI slots / character.feat (exclude this choice). */
  takenFeatIds: readonly string[]
  /** Nested feat sub-choices for the selected feat (companion keys). */
  featChoices?: Record<string, string | string[]>
  ownedSkillIds?: ReadonlySet<string>
  ownedToolIds?: ReadonlySet<string>
  errorId?: string
  onChange: (choiceId: string, value: string) => void
  onFeatChoiceChange?: (
    featChoiceId: string,
    value: string | string[] | undefined,
  ) => void
}

function EmbeddedFeatSelect({
  selectedFeatId,
  feats,
  takenFeatIds,
  name,
  onSelect,
}: {
  selectedFeatId: string | null
  feats: readonly FeatDefinition[]
  takenFeatIds: readonly string[]
  name: string
  onSelect: (featId: string) => void
}) {
  return (
    <div
      className="class-picker__asi-feat-options"
      role="radiogroup"
      aria-label="Choose a feat"
    >
      {feats.map((feat) => {
        const inputId = `${name}-feat-${feat.id}`
        const alreadyTaken = takenFeatIds.includes(feat.id)
        const disabled = alreadyTaken && !feat.repeatable

        return (
          <div key={feat.id} className="class-picker__choice-option">
            <input
              id={inputId}
              type="radio"
              name={name}
              value={feat.id}
              checked={selectedFeatId === feat.id}
              disabled={disabled}
              onChange={() => {
                onSelect(feat.id)
              }}
            />
            <label htmlFor={inputId}>
              <span className="class-picker__choice-label">{feat.name}</span>
              {feat.summary ? (
                <span className="choice-accordion__option-description">
                  {feat.summary}
                </span>
              ) : null}
            </label>
          </div>
        )
      })}
    </div>
  )
}

export function AsiChoiceField({
  choiceId,
  value,
  editionId,
  featCatalog,
  takenFeatIds,
  featChoices = {},
  ownedSkillIds = new Set(),
  ownedToolIds = new Set(),
  errorId,
  onChange,
  onFeatChoiceChange,
}: AsiChoiceFieldProps) {
  const reactId = useId()
  const mode = getAsiMode(value)
  const parsed = typeof value === 'string' ? parseAsiChoice(value) : null
  const [feats, setFeats] = useState<FeatDefinition[]>([])

  useEffect(() => {
    let active = true

    void featCatalog.listFeats(editionId).then((list) => {
      if (active) {
        setFeats(
          list.filter((feat) => !isFeatExcludedFromAsiFeatModePicker(feat.id)),
        )
      }
    })

    return () => {
      active = false
    }
  }, [editionId, featCatalog])

  const plus2Ability =
    parsed?.kind === 'plus-2' ? parsed.abilityId : null
  const plus1Abilities =
    parsed?.kind === 'plus-1-1' ? parsed.abilityIds : null
  const selectedFeatId = parsed?.kind === 'feat' ? parsed.featId : null
  const selectedFeatDefinition =
    selectedFeatId === null
      ? null
      : (feats.find((feat) => feat.id === selectedFeatId) ?? null)

  const handleModeChange = (nextMode: AsiMode) => {
    onChange(choiceId, selectAsiMode(nextMode))
  }

  return (
    <div className="class-picker__asi-choice" aria-describedby={errorId}>
      <div
        className="choice-accordion__options"
        role="radiogroup"
        aria-label="Ability Score Improvement"
      >
        {ASI_CHOICE_OPTIONS.map((option) => {
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

      {mode === 'feat' ? (
        <div className="class-picker__asi-detail">
          <EmbeddedFeatSelect
            selectedFeatId={selectedFeatId}
            feats={feats}
            takenFeatIds={takenFeatIds}
            name={`${choiceId}-feat-${reactId}`}
            onSelect={(featId) => {
              onChange(choiceId, selectAsiFeat(featId))
            }}
          />
          {selectedFeatDefinition !== null &&
          selectedFeatDefinition.choices.length > 0 &&
          onFeatChoiceChange !== undefined ? (
            <FeatSubChoicesFields
              definition={selectedFeatDefinition}
              choices={featChoices}
              ownedSkillIds={ownedSkillIds}
              ownedToolIds={ownedToolIds}
              onChange={onFeatChoiceChange}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
