import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatDefinition } from '../../domain/feat/types'
import {
  evaluateFeatEligibility,
  type FeatEligibilityContext,
} from '../../domain/feat/eligibility'
import {
  isFeatExcludedFromFeatGrantPickers,
  selectEpicBoonFeat,
} from '../../domain/class/epicBoon'
import { getEpicBoonFeatIdFromChoiceValue } from '../../domain/class/epicBoon'
import { formatFeatCategoryBadge } from '../feat/formatFeatDetails'

export type FeatGrantChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
  /** Optional recommended feat id (e.g. class Epic Boon recommendation). */
  recommendedFeatId?: string | null
  errorId?: string
  onChange: (choiceId: string, value: string) => void
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
  errorId,
  onChange,
}: FeatGrantChoiceFieldProps) {
  const reactId = useId()
  const [feats, setFeats] = useState<FeatDefinition[]>([])
  const selectedFeatId = getEpicBoonFeatIdFromChoiceValue(value)

  useEffect(() => {
    let active = true

    void featCatalog.listFeats(editionId).then((list) => {
      if (active) {
        setFeats(
          list.filter((feat) => !isFeatExcludedFromFeatGrantPickers(feat.id)),
        )
      }
    })

    return () => {
      active = false
    }
  }, [editionId, featCatalog])

  const contextWithTaken: FeatEligibilityContext = useMemo(
    () => ({
      ...eligibilityContext,
      takenFeatIds,
    }),
    [eligibilityContext, takenFeatIds],
  )

  const sortedFeats = useMemo(
    () => sortFeatsForGrantPicker(feats, recommendedFeatId),
    [feats, recommendedFeatId],
  )

  return (
    <div
      className="class-picker__asi-feat-options"
      role="radiogroup"
      aria-label="Choose a feat"
      aria-describedby={errorId}
    >
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
              <span className="class-picker__choice-label">
                {feat.name}
                {isRecommended ? (
                  <span className="class-picker__feat-recommended">
                    {' '}
                    Recommended
                  </span>
                ) : null}
              </span>
              <span className="choice-accordion__option-description">
                {formatFeatCategoryBadge(feat.category)}
                {feat.summary ? ` · ${feat.summary}` : ''}
                {!eligibility.eligible ? ` — ${eligibility.reason}` : ''}
              </span>
            </label>
          </div>
        )
      })}
    </div>
  )
}
