import type { CharacterClassSelection } from '../../domain/class/types'
import {
  getAllocatedLevel,
  getEffectiveClassesForCharacterAllocation,
  getRemainingLevels,
} from '../../domain/character/classLevels'
import type { ClassSelectionDraft, ClassSelectionDrafts } from './classSelectionDraft'

export type ClassAllocationSummaryProps = {
  targetLevel: number
  committedClasses: CharacterClassSelection[]
  classDrafts: ClassSelectionDrafts
  activeInstanceId: string | null
  draft: ClassSelectionDraft | null
}

export function ClassAllocationSummary({
  targetLevel,
  committedClasses,
  classDrafts,
}: ClassAllocationSummaryProps) {
  const effectiveClasses = getEffectiveClassesForCharacterAllocation(
    committedClasses,
    classDrafts,
  )
  const allocatedLevel = getAllocatedLevel(effectiveClasses)
  const remainingLevels = getRemainingLevels(targetLevel, effectiveClasses)

  let statusText = `${remainingLevels} level${remainingLevels === 1 ? '' : 's'} remaining`

  if (remainingLevels < 0) {
    statusText = `${Math.abs(remainingLevels)} level${
      Math.abs(remainingLevels) === 1 ? '' : 's'
    } over target`
  } else if (remainingLevels === 0) {
    statusText = 'All levels allocated'
  }

  return (
    <p className="class-picker__allocation" aria-live="polite">
      Allocated {allocatedLevel} of {targetLevel} levels ({statusText})
    </p>
  )
}

export type ClassInstanceListProps = {
  instances: {
    instanceId: string
    className: string
    level: number
    isDraft: boolean
  }[]
  activeInstanceId: string | null
  onSelectInstance: (instanceId: string) => void
  onRemoveInstance: (instanceId: string) => void
}

export function ClassInstanceList({
  instances,
  activeInstanceId,
  onSelectInstance,
  onRemoveInstance,
}: ClassInstanceListProps) {
  if (instances.length === 0) {
    return null
  }

  return (
    <ul className="class-picker__instance-list" role="list">
      {instances.map((instance) => {
        const isActive = instance.instanceId === activeInstanceId

        return (
          <li key={instance.instanceId} className="class-picker__instance-item">
            <button
              type="button"
              className={
                isActive
                  ? 'class-picker__instance-tab class-picker__instance-tab--active'
                  : 'class-picker__instance-tab'
              }
              aria-pressed={isActive}
              onClick={() => {
                onSelectInstance(instance.instanceId)
              }}
            >
              {instance.className} {instance.level}
              {instance.isDraft ? ' (draft)' : ''}
            </button>
            <button
              type="button"
              className="class-picker__instance-remove"
              aria-label={`Remove ${instance.className}`}
              onClick={() => {
                onRemoveInstance(instance.instanceId)
              }}
            >
              Remove
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export type StartingClassPickerProps = {
  instances: {
    instanceId: string
    className: string
  }[]
  startingClassInstanceId: string | null
  onStartingClassChange: (instanceId: string) => void
}

export function StartingClassPicker({
  instances,
  startingClassInstanceId,
  onStartingClassChange,
}: StartingClassPickerProps) {
  if (instances.length < 2) {
    return null
  }

  return (
    <fieldset className="class-picker__starting-class">
      <legend>Which class did your character begin with?</legend>
      <p className="helper-text">
        Your starting class may affect starting proficiencies and equipment.
      </p>
      <div className="class-picker__starting-class-options">
        {instances.map((instance) => {
          const inputId = `starting-class-${instance.instanceId}`

          return (
            <div key={instance.instanceId} className="class-picker__starting-class-option">
              <input
                id={inputId}
                type="radio"
                name="starting-class"
                value={instance.instanceId}
                checked={startingClassInstanceId === instance.instanceId}
                onChange={() => {
                  onStartingClassChange(instance.instanceId)
                }}
              />
              <label htmlFor={inputId}>{instance.className}</label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
