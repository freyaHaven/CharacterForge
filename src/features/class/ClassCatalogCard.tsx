import type { ClassDefinition } from '../../domain/class/types'
import { SelectionCheckIcon } from '../species/SpeciesUiIcons'
import { ClassIcon } from './ClassIcon'

type ClassCatalogCardProps = {
  classDefinition: ClassDefinition
  isSelected: boolean
  isPreview?: boolean
  onSelect: (classDefinition: ClassDefinition) => void
}

export function ClassCatalogCard({
  classDefinition,
  isSelected,
  isPreview = false,
  onSelect,
}: ClassCatalogCardProps) {
  const cardNameId = `class-card-${classDefinition.id}-name`

  return (
    <li>
      <button
        type="button"
        className={
          isSelected
            ? 'class-picker__card class-picker__card--compact class-picker__card--selected'
            : 'class-picker__card class-picker__card--compact'
        }
        aria-pressed={isSelected}
        aria-labelledby={cardNameId}
        onClick={() => {
          onSelect(classDefinition)
        }}
      >
        {isSelected ? (
          <span className="class-picker__card-badge" aria-hidden="true">
            <SelectionCheckIcon />
          </span>
        ) : null}
        <span className="class-picker__card-icon">
          <ClassIcon classId={classDefinition.id} />
        </span>
        <span id={cardNameId} className="class-picker__card-name">
          {classDefinition.name}
          {isPreview ? (
            <span className="class-picker__card-preview">Preview</span>
          ) : null}
        </span>
      </button>
    </li>
  )
}
