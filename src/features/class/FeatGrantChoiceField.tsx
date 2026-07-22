import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatCategory, FeatDefinition } from '../../domain/feat/types'
import type { ClassChoiceOption } from '../../domain/class/types'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import {
  partitionFeatCatalogue,
  type FeatEntitlementPolicy,
} from '../../domain/feat/catalogueEligibility'
import type { CharacterCapabilityInventory } from '../../domain/capability/types'
import { emptyCapabilityInventory } from '../../domain/capability/types'
import { selectEpicBoonFeat } from '../../domain/class/epicBoon'
import { getEpicBoonFeatIdFromChoiceValue } from '../../domain/class/epicBoon'
import { getFightingStyleFeatIdFromChoiceValue } from '../../domain/class/fightingStyle'
import { formatFeatCategoryBadge } from '../feat/formatFeatDetails'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

export type FeatGrantChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
  /** Character capabilities for redundant-feat detection. */
  capabilityInventory?: CharacterCapabilityInventory
  /** Optional recommended feat id (e.g. class Epic Boon recommendation). */
  recommendedFeatId?: string | null
  /** When set, only feats in this category are listed. */
  categoryFilter?: FeatCategory | null
  /** Class-only alternates (e.g. Blessed Warrior) shown alongside catalogue feats. */
  alternateOptions?: readonly ClassChoiceOption[]
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

function sortCatalogueEntries(
  entries: ReturnType<typeof partitionFeatCatalogue>['visible'],
  recommendedFeatId: string | null | undefined,
): ReturnType<typeof partitionFeatCatalogue>['visible'] {
  const epicBoons = entries.filter(
    (entry) => entry.definition.category === 'epic-boon',
  )
  const others = entries.filter(
    (entry) => entry.definition.category !== 'epic-boon',
  )

  const sortWithin = (
    list: ReturnType<typeof partitionFeatCatalogue>['visible'],
  ) =>
    [...list].sort((left, right) => {
      if (recommendedFeatId !== undefined && recommendedFeatId !== null) {
        if (left.definition.id === recommendedFeatId) {
          return -1
        }
        if (right.definition.id === recommendedFeatId) {
          return 1
        }
      }
      return left.definition.name.localeCompare(right.definition.name)
    })

  return [...sortWithin(epicBoons), ...sortWithin(others)]
}

export function FeatGrantChoiceField({
  choiceId,
  value,
  editionId,
  featCatalog,
  takenFeatIds,
  eligibilityContext,
  capabilityInventory = emptyCapabilityInventory(),
  recommendedFeatId = null,
  categoryFilter = null,
  alternateOptions = [],
  featChoices = {},
  ownedSkillIds = new Set(),
  ownedToolIds = new Set(),
  errorId,
  onChange,
  onFeatChoiceChange,
}: FeatGrantChoiceFieldProps) {
  const reactId = useId()
  const [feats, setFeats] = useState<FeatDefinition[]>([])
  const [showUnavailable, setShowUnavailable] = useState(false)
  const [showRedundant, setShowRedundant] = useState(false)
  const selectedFeatId =
    categoryFilter === 'fighting-style'
      ? getFightingStyleFeatIdFromChoiceValue(value)
      : getEpicBoonFeatIdFromChoiceValue(value)
  const selectedAlternateId =
    typeof value === 'string' &&
    alternateOptions.some((option) => option.id === value)
      ? value
      : null

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

  const policy: FeatEntitlementPolicy = useMemo(
    () =>
      categoryFilter === null
        ? { kind: 'any-qualifying' }
        : { kind: 'category', category: categoryFilter },
    [categoryFilter],
  )

  const contextWithTaken: FeatEligibilityContext = useMemo(
    () => ({
      ...eligibilityContext,
      // Fighting Style grants are the Fighting Style Feature.
      hasFightingStyle:
        categoryFilter === 'fighting-style'
          ? true
          : eligibilityContext.hasFightingStyle,
      takenFeatIds,
    }),
    [categoryFilter, eligibilityContext, takenFeatIds],
  )

  const sortedEntries = useMemo(() => {
    const partitioned = partitionFeatCatalogue({
      feats,
      context: contextWithTaken,
      policy,
      selectedFeatId,
      showUnavailable,
      showRedundant,
      capabilityInventory,
    })
    return sortCatalogueEntries(partitioned.visible, recommendedFeatId)
  }, [
    capabilityInventory,
    contextWithTaken,
    feats,
    policy,
    recommendedFeatId,
    selectedFeatId,
    showRedundant,
    showUnavailable,
  ])

  const selectedFeatDefinition =
    selectedFeatId === null
      ? null
      : (feats.find((feat) => feat.id === selectedFeatId) ?? null)

  const ariaLabel =
    categoryFilter === 'fighting-style'
      ? 'Choose a Fighting Style'
      : 'Choose a feat'

  return (
    <div aria-describedby={errorId}>
      <label className="feat-picker__show-unavailable">
        <input
          type="checkbox"
          checked={showUnavailable}
          onChange={(event) => {
            setShowUnavailable(event.target.checked)
          }}
        />
        <span>Show unavailable feats</span>
      </label>
      <label className="feat-picker__show-unavailable">
        <input
          type="checkbox"
          checked={showRedundant}
          onChange={(event) => {
            setShowRedundant(event.target.checked)
          }}
        />
        <span>Show redundant choices</span>
      </label>
      <div
        className="class-picker__asi-feat-options"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {alternateOptions.map((option) => {
          const inputId = `${choiceId}-alt-${option.id}-${reactId}`
          return (
            <div key={option.id} className="class-picker__choice-option">
              <input
                id={inputId}
                type="radio"
                name={`${choiceId}-feat-${reactId}`}
                value={option.id}
                checked={selectedAlternateId === option.id}
                onChange={() => {
                  onChange(choiceId, option.id)
                }}
              />
              <label htmlFor={inputId}>
                <span className="class-picker__choice-option-name">
                  {option.label}
                </span>
                {option.description !== undefined ? (
                  <span className="class-picker__choice-option-description">
                    {option.description}
                  </span>
                ) : null}
              </label>
            </div>
          )
        })}

        {sortedEntries.map((entry) => {
          const feat = entry.definition
          const inputId = `${choiceId}-feat-${feat.id}-${reactId}`
          const disabled = !entry.eligibility.eligible
          const isRecommended = feat.id === recommendedFeatId

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
                name={`${choiceId}-feat-${reactId}`}
                value={feat.id}
                checked={selectedFeatId === feat.id}
                disabled={disabled}
                onChange={() => {
                  if (disabled) {
                    return
                  }
                  onChange(choiceId, selectEpicBoonFeat(feat.id))
                }}
              />
              <label htmlFor={inputId}>
                <span className="class-picker__choice-option-name">
                  {feat.name}
                  {isRecommended ? ' (Recommended)' : ''}
                </span>
                <span className="class-picker__choice-option-meta">
                  {formatFeatCategoryBadge(feat.category)}
                </span>
                <span className="class-picker__choice-option-description">
                  {feat.summary}
                </span>
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
  )
}
