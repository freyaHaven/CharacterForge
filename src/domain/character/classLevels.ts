import type {
  CharacterClassSelection,
  CharacterLevel,
  ClassChoiceValue,
} from '../class/types'
import type { CharacterClassSelectionDraft } from '../../features/class/classSelectionDraft'
import { instanceDraftToClassInstance } from '../../features/class/classSelectionDraft'
import { MAX_CLASS_LEVEL, MIN_CLASS_LEVEL } from '../class/types'

export function getAllocatedLevel(
  classes: readonly CharacterClassSelection[],
): CharacterLevel {
  return classes.reduce((total, entry) => total + entry.level, 0)
}

export function getRemainingLevels(
  targetLevel: CharacterLevel,
  classes: readonly CharacterClassSelection[],
): number {
  return targetLevel - getAllocatedLevel(classes)
}

export function getEffectiveClassesForCharacterAllocation(
  committedClasses: readonly CharacterClassSelection[],
  classDrafts: Record<string, CharacterClassSelectionDraft>,
): CharacterClassSelection[] {
  const instances = new Map<string, CharacterClassSelection>()

  for (const instance of committedClasses) {
    instances.set(instance.instanceId, instance)
  }

  for (const draft of Object.values(classDrafts)) {
    instances.set(draft.instanceId, instanceDraftToClassInstance(draft))
  }

  return [...instances.values()]
}

export function getEffectiveClassesForAllocation(
  committedClasses: readonly CharacterClassSelection[],
  activeInstanceId: string | null,
  draft: {
    classId: string
    level: CharacterLevel
    choices: Record<string, ClassChoiceValue>
  } | null,
): CharacterClassSelection[] {
  if (activeInstanceId === null || draft === null) {
    return [...committedClasses]
  }

  const committed = committedClasses.find(
    (instance) => instance.instanceId === activeInstanceId,
  )

  if (committed !== undefined) {
    return committedClasses.map((instance) =>
      instance.instanceId === activeInstanceId
        ? {
            ...instance,
            level: draft.level,
            choices: { ...draft.choices },
          }
        : instance,
    )
  }

  return [
    ...committedClasses,
    {
      instanceId: activeInstanceId,
      classId: draft.classId,
      level: draft.level,
      choices: { ...draft.choices },
    },
  ]
}

export function getMaxLevelForInstance(
  targetLevel: CharacterLevel,
  committedClasses: readonly CharacterClassSelection[],
  activeInstanceId: string | null,
  draft: {
    classId: string
    level: CharacterLevel
    choices: Record<string, ClassChoiceValue>
  } | null,
): CharacterLevel {
  const effectiveClasses = getEffectiveClassesForAllocation(
    committedClasses,
    activeInstanceId,
    draft,
  )
  const otherAllocated = getAllocatedLevel(
    effectiveClasses.filter(
      (instance) => instance.instanceId !== activeInstanceId,
    ),
  )

  return Math.min(
    MAX_CLASS_LEVEL,
    Math.max(MIN_CLASS_LEVEL, targetLevel - otherAllocated),
  ) as CharacterLevel
}

export function hasUniqueClassIds(
  classes: readonly CharacterClassSelection[],
): boolean {
  const seen = new Set<string>()

  for (const entry of classes) {
    if (seen.has(entry.classId)) {
      return false
    }

    seen.add(entry.classId)
  }

  return true
}

export function isValidCharacterLevel(value: unknown): value is CharacterLevel {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_CLASS_LEVEL &&
    value <= MAX_CLASS_LEVEL
  )
}
