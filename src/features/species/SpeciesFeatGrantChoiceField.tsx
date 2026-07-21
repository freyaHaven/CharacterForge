import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatCategory, FeatDefinition } from '../../domain/feat/types'
import {
  evaluateFeatEligibility,
  type FeatEligibilityContext,
} from '../../domain/feat/eligibility'
import { isFeatExcludedFromFeatGrantPickers } from '../../domain/class/epicBoon'
import { formatFeatCategoryBadge } from '../feat/formatFeatDetails'

export type SpeciesFeatGrantChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  featCategory: FeatCategory
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
  recommendedFeatId?: string | null
  errorId?: string
  onChange: (choiceId: string, value: string) => void
}

export function SpeciesFeatGrantChoiceField({
  choiceId,
  value,
  editionId,
  featCatalog,
  featCategory,
  takenFeatIds,
  eligibilityContext,
  recommendedFeatId = null,
  errorId,
  onChange,
}: SpeciesFeatGrantChoiceFieldProps) {
  const reactId = useId()
  const [feats, setFeats] = useState<FeatDefinition[]>([])
  const selectedFeatId =
    typeof value === 'string' && value.length > 0 ? value : null

  useEffect(() => {
    let active = true

    void featCatalog.listFeats(editionId).then((list) => {
      if (active) {
        setFeats(
          list.filter(
            (feat) =>
              feat.category === featCategory &&
              !isFeatExcludedFromFeatGrantPickers(feat.id),
          ),
        )
      }
    })

    return () => {
      active = false
    }
  }, [editionId, featCatalog, featCategory])

  const contextWithTaken: FeatEligibilityContext = useMemo(
    () => ({
      ...eligibilityContext,
      takenFeatIds,
    }),
    [eligibilityContext, takenFeatIds],
  )

  const sortedFeats = useMemo(() => {
    return [...feats].sort((left, right) => {
      if (recommendedFeatId !== null) {
        if (left.id === recommendedFeatId) {
          return -1
        }
        if (right.id === recommendedFeatId) {
          return 1
        }
      }
      return left.name.localeCompare(right.name)
    })
  }, [feats, recommendedFeatId])

  return (
    <div
      className="class-picker__asi-feat-options"
      role="radiogroup"
      aria-label="Choose an Origin feat"
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
                onChange(choiceId, feat.id)
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
