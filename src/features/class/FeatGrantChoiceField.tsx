import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatCategory, FeatDefinition } from '../../domain/feat/types'
import type { ClassChoiceOption } from '../../domain/class/types'
import {
  evaluateFeatEligibility,
  type FeatEligibilityContext,
} from '../../domain/feat/eligibility'
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

function sortFeatsForGrantPicker(
  feats: readonly FeatDefinition[],
  recommendedFeatId: string | null | undefined,
): FeatDefinition[] {
  const epicBoons = feats.filter((feat) => feat.category === 'epic-boon')
  const others = feats.filter((feat) => feat.category !== 'epic-boon')

  const sortWithin = (list: FeatDefinition[]) =>
    [...list].sort((left, right) => {
      if (recommendedFeatId !== undefined && recommendedFeatId !== null) {
        if (left.id === recommendedFeatId) {
          return -1
        }
        if (right.id === recommendedFeatId) {
          return 1
        }
      }
      return left.name.localeCompare(right.name)
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
      if (!active) {
        return
      }

      setFeats(
        list.filter((feat) => {
          if (categoryFilter !== null && feat.category !== categoryFilter) {
            return false
          }
          return true
        }),
      )
    })

    return () => {
      active = false
    }
  }, [categoryFilter, editionId, featCatalog])

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

  const sortedFeats = useMemo(
    () => sortFeatsForGrantPicker(feats, recommendedFeatId),
    [feats, recommendedFeatId],
  )

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

        {sortedFeats.map((feat) => {
          const inputId = `${choiceId}-feat-${feat.id}-${reactId}`
          const eligibility = evaluateFeatEligibility(feat, contextWithTaken)
          const alreadyTaken = takenFeatIds.includes(feat.id)
          const disabled =
            !eligibility.eligible || (alreadyTaken && !feat.repeatable)
          const isRecommended = feat.id === recommendedFeatId

          return (
            <div key={feat.id} className="class-picker__choice-option">
              <input
                id={inputId}
                type="radio"
                name={`${choiceId}-feat-${reactId}`}
                value={feat.id}
                checked={selectedFeatId === feat.id}
                disabled={disabled}
                onChange={() => {
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
