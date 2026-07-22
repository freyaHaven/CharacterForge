import { useEffect, useId, useMemo, useState } from 'react'
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
import {
  partitionFeatCatalogue,
  type FeatEntitlementPolicy,
} from '../../domain/feat/catalogueEligibility'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { formatAbilityLabel } from './formatClassDetails'
import type { AbilityId } from '../../domain/abilities/types'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

const ASI_FEAT_POLICY: FeatEntitlementPolicy = { kind: 'any-qualifying' }

export type AsiChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  /** Feat ids already taken by other ASI slots / character.feat (exclude this choice). */
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
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
  entries,
  name,
  showUnavailable,
  onShowUnavailableChange,
  onSelect,
}: {
  selectedFeatId: string | null
  entries: ReturnType<typeof partitionFeatCatalogue>['visible']
  name: string
  showUnavailable: boolean
  onShowUnavailableChange: (value: boolean) => void
  onSelect: (featId: string) => void
}) {
  return (
    <div className="class-picker__asi-feat-catalog">
      <label className="feat-picker__show-unavailable">
        <input
          type="checkbox"
          checked={showUnavailable}
          onChange={(event) => {
            onShowUnavailableChange(event.target.checked)
          }}
        />
        <span>Show unavailable feats</span>
      </label>
      <div
        className="class-picker__asi-feat-options"
        role="radiogroup"
        aria-label="Choose a feat"
      >
        {entries.map((entry) => {
          const feat = entry.definition
          const inputId = `${name}-feat-${feat.id}`
          const disabled = !entry.eligibility.eligible

          return (
            <div
              key={feat.id}
              className={[
                'class-picker__choice-option',
                disabled ? 'class-picker__choice-option--unavailable' : null,
                entry.retainedInvalid
                  ? 'class-picker__choice-option--invalid'
                  : null,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={feat.id}
                checked={selectedFeatId === feat.id}
                disabled={disabled}
                onChange={() => {
                  if (disabled) {
                    return
                  }
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
                {disabled ? (
                  <span className="class-picker__choice-option-reason">
                    {!entry.eligibility.eligible
                      ? entry.retainedInvalid
                        ? `Invalid selection: ${entry.eligibility.reason}`
                        : entry.eligibility.reason
                      : null}
                  </span>
                ) : null}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AsiChoiceField({
  choiceId,
  value,
  editionId,
  featCatalog,
  takenFeatIds,
  eligibilityContext,
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
  const [showUnavailable, setShowUnavailable] = useState(false)

  useEffect(() => {
    let active = true

    void featCatalog.listFeats(editionId).then((list) => {
      if (active) {
        setFeats(list)
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

  const contextWithTaken: FeatEligibilityContext = useMemo(
    () => ({
      ...eligibilityContext,
      takenFeatIds,
    }),
    [eligibilityContext, takenFeatIds],
  )

  const featEntries = useMemo(
    () =>
      partitionFeatCatalogue({
        feats,
        context: contextWithTaken,
        policy: ASI_FEAT_POLICY,
        selectedFeatId,
        showUnavailable,
        excludeFeatIds: feats
          .filter((feat) => isFeatExcludedFromAsiFeatModePicker(feat.id))
          .map((feat) => feat.id),
      }).visible,
    [contextWithTaken, feats, selectedFeatId, showUnavailable],
  )

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
            entries={featEntries}
            name={`${choiceId}-feat-${reactId}`}
            showUnavailable={showUnavailable}
            onShowUnavailableChange={setShowUnavailable}
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
