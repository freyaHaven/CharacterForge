import type { BackgroundDefinition } from '../../domain/background/types'
import { SelectionCheckIcon } from '../species/SpeciesUiIcons'
import { BackgroundIcon } from './BackgroundIcon'

type BackgroundCatalogCardProps = {
  backgroundDefinition: BackgroundDefinition
  isSelected: boolean
  onSelect: (backgroundDefinition: BackgroundDefinition) => void
}

export function BackgroundCatalogCard({
  backgroundDefinition,
  isSelected,
  onSelect,
}: BackgroundCatalogCardProps) {
  const cardNameId = `background-card-${backgroundDefinition.id}-name`

  return (
    <li>
      <button
        type="button"
        className={
          isSelected
            ? 'background-picker__card background-picker__card--selected'
            : 'background-picker__card'
        }
        aria-pressed={isSelected}
        aria-labelledby={cardNameId}
        onClick={() => {
          onSelect(backgroundDefinition)
        }}
      >
        {isSelected ? (
          <span className="background-picker__card-badge" aria-hidden="true">
            <SelectionCheckIcon />
          </span>
        ) : null}
        <span className="background-picker__card-icon">
          <BackgroundIcon backgroundId={backgroundDefinition.id} />
        </span>
        <span id={cardNameId} className="background-picker__card-name">
          {backgroundDefinition.name}
        </span>
      </button>
    </li>
  )
}
