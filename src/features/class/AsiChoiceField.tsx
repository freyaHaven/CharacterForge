import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { AbilityScores, EditionId } from '../../domain/types'
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
import type { CharacterCapabilityInventory } from '../../domain/capability/types'
import { emptyCapabilityInventory } from '../../domain/capability/types'
import { formatAbilityLabel } from './formatClassDetails'
import type { AbilityId } from '../../domain/abilities/types'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

const ASI_FEAT_POLICY: FeatEntitlementPolicy = { kind: 'any-qualifying' }
const ASI_SCORE_MAXIMUM = 20

export type AsiChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  /** Feat ids already taken by other ASI slots / character.feat (exclude this choice). */
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
  /**
   * Current ability scores for card display.
   * When omitted, falls back to {@link eligibilityContext.abilityScores}.
   * Pass `null` to hide score lines (scores not yet assigned).
   */
  currentAbilityScores?: AbilityScores | null
  /** Character capabilities for redundant-feat detection. */
  capabilityInventory?: CharacterCapabilityInventory
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
  showRedundant,
  onShowRedundantChange,
  onSelect,
}: {
  selectedFeatId: string | null
  entries: ReturnType<typeof partitionFeatCatalogue>['visible']
  name: string
  showUnavailable: boolean
  onShowUnavailableChange: (value: boolean) => void
  showRedundant: boolean
  onShowRedundantChange: (value: boolean) => void
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
      <label className="feat-picker__show-unavailable">
        <input
          type="checkbox"
          checked={showRedundant}
          onChange={(event) => {
            onShowRedundantChange(event.target.checked)
          }}
        />
        <span>Show redundant choices</span>
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
                {entry.overlap.status === 'redundant' && !disabled ? (
                  <span className="class-picker__choice-option-reason class-picker__choice-option-reason--redundant">
                    {entry.overlap.reasons[0]?.message ??
                      'Most benefits overlap with capabilities you already have.'}
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

type AsiAbilityGridProps = {
  choiceId: string
  reactId: string
  mode: AsiMode | null
  scores: AbilityScores | null
  plus2Ability: AbilityId | null
  plus1Selected: readonly AbilityId[]
  onSelectPlus2: (abilityId: AbilityId) => void
  onTogglePlus1: (abilityId: AbilityId) => void
}

function AsiAbilityGrid({
  choiceId,
  reactId,
  mode,
  scores,
  plus2Ability,
  plus1Selected,
  onSelectPlus2,
  onTogglePlus1,
}: AsiAbilityGridProps) {
  const gridDisabled = mode === 'feat' || mode === null || mode === 'plus-1'
  const selectionKind = mode === 'plus-1-1' ? 'checkbox' : 'radio'
  const bonusLabel = mode === 'plus-1-1' ? '+1' : '+2'
  const noteId = `${choiceId}-asi-score-cap-${reactId}`

  return (
    <div className="class-picker__asi-ability-panel">
      {mode === 'plus-1-1' ? (
        <p className="class-picker__asi-selection-summary" role="status">
          Selected {plus1Selected.length} / 2
        </p>
      ) : null}

      <div
        className={[
          'class-picker__asi-ability-grid',
          gridDisabled ? 'class-picker__asi-ability-grid--disabled' : null,
        ]
          .filter(Boolean)
          .join(' ')}
        role={selectionKind === 'radio' ? 'radiogroup' : 'group'}
        aria-label={
          mode === 'plus-1-1'
            ? 'Ability scores to increase by 1'
            : mode === 'plus-2'
              ? 'Ability score to increase by 2'
              : 'Ability scores'
        }
        aria-disabled={gridDisabled}
        aria-describedby={noteId}
      >
        {ALL_ABILITY_OPTIONS.map((abilityId) => {
          const inputId = `${choiceId}-ability-${abilityId}-${reactId}`
          const currentScore = scores?.[abilityId]
          const atMaximum =
            currentScore !== undefined && currentScore >= ASI_SCORE_MAXIMUM
          const selected =
            mode === 'plus-2'
              ? plus2Ability === abilityId
              : mode === 'plus-1-1'
                ? plus1Selected.includes(abilityId)
                : false
          const plus1AtLimit =
            mode === 'plus-1-1' &&
            !selected &&
            plus1Selected.length >= 2
          const disabled = gridDisabled || atMaximum || plus1AtLimit

          return (
            <div
              key={abilityId}
              className={[
                'choice-accordion__option',
                'choice-accordion__option--card',
                'class-picker__asi-ability-card',
                selected ? 'class-picker__asi-ability-card--selected' : null,
                disabled ? 'class-picker__asi-ability-card--disabled' : null,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                id={inputId}
                type={selectionKind}
                name={
                  selectionKind === 'radio'
                    ? `${choiceId}-ability-${reactId}`
                    : `${choiceId}-ability-${abilityId}-${reactId}`
                }
                value={abilityId}
                checked={selected}
                disabled={disabled}
                onChange={() => {
                  if (disabled) {
                    return
                  }
                  if (mode === 'plus-2') {
                    onSelectPlus2(abilityId)
                    return
                  }
                  if (mode === 'plus-1-1') {
                    onTogglePlus1(abilityId)
                  }
                }}
              />
              <label htmlFor={inputId}>
                <span className="choice-accordion__option-label">
                  {formatAbilityLabel(abilityId)}
                </span>
                {currentScore !== undefined ? (
                  <span className="class-picker__asi-ability-score">
                    {gridDisabled
                      ? String(currentScore)
                      : `${currentScore} (${bonusLabel})`}
                  </span>
                ) : null}
                {atMaximum ? (
                  <span className="class-picker__asi-ability-cap">
                    Maximum reached
                  </span>
                ) : null}
              </label>
            </div>
          )
        })}
      </div>

      <p id={noteId} className="class-picker__asi-score-note">
        Ability scores can&apos;t be increased above {ASI_SCORE_MAXIMUM}.
      </p>
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
  currentAbilityScores,
  capabilityInventory = emptyCapabilityInventory(),
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
  const [showRedundant, setShowRedundant] = useState(false)
  const [plus1Draft, setPlus1Draft] = useState<AbilityId[]>([])

  const scores =
    currentAbilityScores === undefined
      ? eligibilityContext.abilityScores
      : currentAbilityScores

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

  useEffect(() => {
    if (plus1Abilities !== null) {
      setPlus1Draft((current) =>
        current.length === 2 &&
        current[0] === plus1Abilities[0] &&
        current[1] === plus1Abilities[1]
          ? current
          : [...plus1Abilities],
      )
      return
    }

    if (mode !== 'plus-1-1') {
      setPlus1Draft((current) => (current.length === 0 ? current : []))
    }
  }, [mode, plus1Abilities, value])

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
        showRedundant,
        capabilityInventory,
        excludeFeatIds: feats
          .filter((feat) => isFeatExcludedFromAsiFeatModePicker(feat.id))
          .map((feat) => feat.id),
      }).visible,
    [
      capabilityInventory,
      contextWithTaken,
      feats,
      selectedFeatId,
      showRedundant,
      showUnavailable,
    ],
  )

  const handleModeChange = (nextMode: AsiMode) => {
    setPlus1Draft([])
    onChange(choiceId, selectAsiMode(nextMode))
  }

  function handleTogglePlus1(abilityId: AbilityId) {
    const currentlySelected = plus1Draft.includes(abilityId)
    let next: AbilityId[]

    if (currentlySelected) {
      next = plus1Draft.filter((id) => id !== abilityId)
    } else if (plus1Draft.length >= 2) {
      return
    } else {
      next = [...plus1Draft, abilityId]
    }

    setPlus1Draft(next)

    if (next.length === 2) {
      onChange(choiceId, selectAsiPlus1Plus1(next[0]!, next[1]!))
      return
    }

    onChange(choiceId, selectAsiMode('plus-1-1'))
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

      <AsiAbilityGrid
        choiceId={choiceId}
        reactId={reactId}
        mode={mode}
        scores={scores}
        plus2Ability={plus2Ability}
        plus1Selected={plus1Draft}
        onSelectPlus2={(abilityId) => {
          onChange(choiceId, selectAsiPlus2(abilityId))
        }}
        onTogglePlus1={handleTogglePlus1}
      />

      {mode === 'feat' ? (
        <div className="class-picker__asi-detail">
          <EmbeddedFeatSelect
            selectedFeatId={selectedFeatId}
            entries={featEntries}
            name={`${choiceId}-feat-${reactId}`}
            showUnavailable={showUnavailable}
            onShowUnavailableChange={setShowUnavailable}
            showRedundant={showRedundant}
            onShowRedundantChange={setShowRedundant}
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
