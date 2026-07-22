import { useEffect, useId, useMemo, useState } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { EditionId } from '../../domain/types'
import type { FeatCategory, FeatDefinition } from '../../domain/feat/types'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { partitionFeatCatalogue } from '../../domain/feat/catalogueEligibility'
import { formatFeatCategoryBadge } from '../feat/formatFeatDetails'
import { FeatSubChoicesFields } from '../feat/FeatSubChoicesFields'

export type SpeciesFeatGrantChoiceFieldProps = {
  choiceId: string
  value: string | undefined
  editionId: EditionId
  featCatalog: FeatCatalog
  featCategory: FeatCategory
  takenFeatIds: readonly string[]
  eligibilityContext: FeatEligibilityContext
  recommendedFeatId?: string | null
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

export function SpeciesFeatGrantChoiceField({
  choiceId,
  value,
  editionId,
  featCatalog,
  featCategory,
  takenFeatIds,
  eligibilityContext,
  recommendedFeatId = null,
  featChoices = {},
  ownedSkillIds = new Set(),
  ownedToolIds = new Set(),
  errorId,
  onChange,
  onFeatChoiceChange,
}: SpeciesFeatGrantChoiceFieldProps) {
  const reactId = useId()
  const [feats, setFeats] = useState<FeatDefinition[]>([])
  const [showUnavailable, setShowUnavailable] = useState(false)
  const selectedFeatId =
    typeof value === 'string' && value.length > 0 ? value : null

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

  const contextWithTaken: FeatEligibilityContext = useMemo(
    () => ({
      ...eligibilityContext,
      takenFeatIds,
    }),
    [eligibilityContext, takenFeatIds],
  )

  const sortedEntries = useMemo(() => {
    const partitioned = partitionFeatCatalogue({
      feats,
      context: contextWithTaken,
      policy: { kind: 'category', category: featCategory },
      selectedFeatId,
      showUnavailable,
    })

    return [...partitioned.visible].sort((left, right) => {
      if (recommendedFeatId !== null) {
        if (left.definition.id === recommendedFeatId) {
          return -1
        }
        if (right.definition.id === recommendedFeatId) {
          return 1
        }
      }
      return left.definition.name.localeCompare(right.definition.name)
    })
  }, [
    contextWithTaken,
    featCategory,
    feats,
    recommendedFeatId,
    selectedFeatId,
    showUnavailable,
  ])

  const selectedFeatDefinition =
    selectedFeatId === null
      ? null
      : (feats.find((feat) => feat.id === selectedFeatId) ?? null)

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
      <div
        className="class-picker__asi-feat-options"
        role="radiogroup"
        aria-label="Choose an Origin feat"
      >
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
                </span>
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
