import type { ClassDefinition } from '../../domain/class/types'
import { SelectionCheckIcon } from '../species/SpeciesUiIcons'
import { ClassIcon } from './ClassIcon'

type ClassCatalogCardProps = {
  classDefinition: ClassDefinition
  /**
   * Class is part of the committed character build.
   * Shows the checkmark and pressed/selected semantics.
   */
  isCommitted?: boolean
  /**
   * Class is the active incomplete draft being configured (not yet committed).
   * Distinct from committed selection — no checkmark, not aria-pressed.
   */
  isEditing?: boolean
  /**
   * Multiclass catalogue: class is included in the current multiclass selection
   * (committed or draft). Prefer `isCommitted` / `isEditing` in single-class mode.
   */
  isSelected?: boolean
  isPreview?: boolean
  onSelect: (classDefinition: ClassDefinition) => void
}

export function ClassCatalogCard({
  classDefinition,
  isCommitted = false,
  isEditing = false,
  isSelected = false,
  isPreview = false,
  onSelect,
}: ClassCatalogCardProps) {
  const cardNameId = `class-card-${classDefinition.id}-name`
  const showCommitted = isCommitted || (isSelected && !isEditing)
  const showEditing = isEditing && !showCommitted

  const className = [
    'class-picker__card',
    'class-picker__card--compact',
    showCommitted ? 'class-picker__card--selected' : null,
    showEditing ? 'class-picker__card--editing' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li>
      <button
        type="button"
        className={className}
        aria-pressed={showCommitted}
        aria-current={showEditing ? 'true' : undefined}
        aria-labelledby={cardNameId}
        onClick={() => {
          onSelect(classDefinition)
        }}
      >
        {showCommitted ? (
          <span className="class-picker__card-badge" aria-hidden="true">
            <SelectionCheckIcon />
          </span>
        ) : null}
        {showEditing ? (
          <span className="class-picker__card-editing-badge">Editing</span>
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
