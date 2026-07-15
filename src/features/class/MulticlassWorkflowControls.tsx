import type { CharacterClassSelection } from '../../domain/class/types'
import { getAllocatedLevel } from '../../domain/character/classLevels'
import { formatMulticlassLevelSummary } from './classBuildMode'
import { LevelStepper } from './LevelStepper'
import { getMaxLevelForMulticlassInstance } from './classBuildMode'

export type MulticlassLevelAllocationProps = {
  instances: CharacterClassSelection[]
  classNamesById: Map<string, string>
  onLevelChange: (instanceId: string, level: number) => void
}

export function MulticlassLevelAllocation({
  instances,
  classNamesById,
  onLevelChange,
}: MulticlassLevelAllocationProps) {
  const totalLevel = getAllocatedLevel(instances)
  const summary = formatMulticlassLevelSummary(instances, classNamesById)

  return (
    <section
      className="class-picker__multiclass-stage"
      aria-labelledby="multiclass-allocate-heading"
    >
      <h3 id="multiclass-allocate-heading" className="class-picker__section-title">
        Assign class levels
      </h3>

      <ul className="class-picker__allocation-list" role="list">
        {instances.map((instance) => {
          const className =
            classNamesById.get(instance.classId) ?? instance.classId
          const maxLevel = getMaxLevelForMulticlassInstance(
            instances,
            instance.instanceId,
          )

          return (
            <li key={instance.instanceId} className="class-picker__allocation-row">
              <span className="class-picker__allocation-label">{className}</span>
              <LevelStepper
                value={instance.level}
                min={1}
                max={maxLevel}
                label={`Levels in ${className}`}
                onChange={(level) => {
                  onLevelChange(instance.instanceId, level)
                }}
              />
            </li>
          )
        })}
      </ul>

      <p className="class-picker__allocation-summary" aria-live="polite">
        {summary}
      </p>
      <p className="class-picker__character-level">Character level: {totalLevel}</p>
    </section>
  )
}

export type MulticlassConfigureTabsProps = {
  instances: {
    instanceId: string
    className: string
    level: number
  }[]
  activeInstanceId: string | null
  onSelectInstance: (instanceId: string) => void
}

export function MulticlassConfigureTabs({
  instances,
  activeInstanceId,
  onSelectInstance,
}: MulticlassConfigureTabsProps) {
  return (
    <section
      className="class-picker__multiclass-stage"
      aria-labelledby="multiclass-configure-heading"
    >
      <h3 id="multiclass-configure-heading" className="class-picker__section-title">
        Configure your classes
      </h3>
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
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
