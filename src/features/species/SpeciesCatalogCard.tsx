import type { SpeciesDefinition } from '../../domain/species/types'
import { SpeciesIcon } from './SpeciesIcon'
import { SelectionCheckIcon } from './SpeciesUiIcons'

type SpeciesCatalogCardProps = {
  species: SpeciesDefinition
  isSelected: boolean
  onSelect: (species: SpeciesDefinition) => void
}

export function SpeciesCatalogCard({
  species,
  isSelected,
  onSelect,
}: SpeciesCatalogCardProps) {
  const cardNameId = `species-card-${species.id}-name`

  return (
    <li>
      <button
        type="button"
        className={
          isSelected
            ? 'species-picker__card species-picker__card--selected'
            : 'species-picker__card'
        }
        aria-pressed={isSelected}
        aria-labelledby={cardNameId}
        onClick={() => {
          onSelect(species)
        }}
      >
        {isSelected ? (
          <span className="species-picker__card-badge" aria-hidden="true">
            <SelectionCheckIcon />
          </span>
        ) : null}
        <span className="species-picker__card-icon">
          <SpeciesIcon speciesId={species.id} />
        </span>
        <span id={cardNameId} className="species-picker__card-name">
          {species.name}
        </span>
      </button>
    </li>
  )
}
