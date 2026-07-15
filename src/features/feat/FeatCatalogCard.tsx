import type { FeatDefinition } from '../../domain/feat/types'
import type { FeatEligibility } from '../../domain/feat/eligibility'
import {
  formatFeatPrerequisite,
} from '../../domain/feat/eligibility'
import { SelectionCheckIcon } from '../species/SpeciesUiIcons'
import {
  formatFeatCategoryBadge,
} from './formatFeatDetails'

type FeatCatalogCardProps = {
  featDefinition: FeatDefinition
  isSelected: boolean
  eligibility: FeatEligibility
  onSelect: (featDefinition: FeatDefinition) => void
}

export function FeatCatalogCard({
  featDefinition,
  isSelected,
  eligibility,
  onSelect,
}: FeatCatalogCardProps) {
  const cardNameId = `feat-card-${featDefinition.id}-name`
  const isDisabled = !eligibility.eligible
  const prerequisiteLabel = formatFeatPrerequisite(featDefinition.prerequisite)

  const className = [
    'feat-picker__card',
    isSelected ? 'feat-picker__card--selected' : null,
    isDisabled ? 'feat-picker__card--disabled' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li>
      <button
        type="button"
        className={className}
        aria-pressed={isSelected}
        aria-labelledby={cardNameId}
        aria-disabled={isDisabled}
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) {
            return
          }

          onSelect(featDefinition)
        }}
      >
        {isSelected ? (
          <span className="feat-picker__card-check" aria-hidden="true">
            <SelectionCheckIcon />
          </span>
        ) : null}
        <span id={cardNameId} className="feat-picker__card-name">
          {featDefinition.name}
        </span>
        <span className="feat-picker__card-category">
          {formatFeatCategoryBadge(featDefinition.category)}
        </span>
        <span className="feat-picker__card-summary">
          {featDefinition.summary}
        </span>
        <span
          className={
            isDisabled
              ? 'feat-picker__card-prereq feat-picker__card-prereq--failed'
              : 'feat-picker__card-prereq'
          }
        >
          {isDisabled
            ? eligibility.reason
            : `Prerequisite: ${prerequisiteLabel}`}
        </span>
      </button>
    </li>
  )
}
