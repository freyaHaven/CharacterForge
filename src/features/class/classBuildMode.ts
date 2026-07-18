import type {
  CharacterClassSelection,
  ClassDefinition,
  ClassLevel,
} from '../../domain/class/types'
import {
  getAllocatedLevel,
  getClassInstancesForHitPoints,
  getEffectiveClassesForCharacterAllocation,
} from '../../domain/character/classLevels'
import type { ClassSelectionDrafts } from './classSelectionDraft'
import { instanceDraftToClassInstance } from './classSelectionDraft'

export { getClassInstancesForHitPoints }

export type ClassBuildMode = 'single-class' | 'multiclass'

export type MulticlassStage =
  | 'select-classes'
  | 'allocate-levels'
  | 'starting-class'
  | 'configure'

export function inferInitialBuildMode(
  classes: readonly CharacterClassSelection[],
  classDrafts: ClassSelectionDrafts = {},
): ClassBuildMode | null {
  const uniqueClassIds = getUniqueClassIds(classes, classDrafts)

  if (uniqueClassIds.length >= 2) {
    return 'multiclass'
  }

  if (classes.length === 1) {
    const draftClassIds = Object.values(classDrafts).map((draft) => draft.classId)
    const hasConflictingDraft = draftClassIds.some(
      (classId) => classId !== classes[0]?.classId,
    )

    if (!hasConflictingDraft) {
      return 'single-class'
    }
  }

  return null
}

export function getEffectiveClassInstances(
  committedClasses: readonly CharacterClassSelection[],
  classDrafts: ClassSelectionDrafts,
): CharacterClassSelection[] {
  return getEffectiveClassesForCharacterAllocation(committedClasses, classDrafts)
}

export function getUniqueClassIds(
  committedClasses: readonly CharacterClassSelection[],
  classDrafts: ClassSelectionDrafts,
): string[] {
  const classIds = new Set<string>()

  for (const instance of committedClasses) {
    classIds.add(instance.classId)
  }

  for (const draft of Object.values(classDrafts)) {
    classIds.add(draft.classId)
  }

  return [...classIds]
}

export function instanceHasConfiguredWork(
  instance: CharacterClassSelection,
): boolean {
  return Object.keys(instance.choices).length > 0
}

export function deriveMulticlassStage(
  committedClasses: readonly CharacterClassSelection[],
  classDrafts: ClassSelectionDrafts,
  startingClassInstanceId: string | null,
): MulticlassStage {
  const instances = getEffectiveClassInstances(committedClasses, classDrafts)
  const uniqueClassIds = new Set(instances.map((instance) => instance.classId))

  if (uniqueClassIds.size < 2) {
    return 'select-classes'
  }

  if (
    instances.some((instance) => instance.level < 1) ||
    getAllocatedLevel(instances) > 20 ||
    getAllocatedLevel(instances) < 2
  ) {
    return 'allocate-levels'
  }

  if (
    startingClassInstanceId === null ||
    !instances.some(
      (instance) => instance.instanceId === startingClassInstanceId,
    )
  ) {
    return 'starting-class'
  }

  return 'configure'
}

export function getMaxLevelForMulticlassInstance(
  instances: readonly CharacterClassSelection[],
  instanceId: string,
): ClassLevel {
  const otherTotal = instances
    .filter((entry) => entry.instanceId !== instanceId)
    .reduce((total, entry) => total + entry.level, 0)

  return Math.min(20, Math.max(1, 20 - otherTotal)) as ClassLevel
}

export function filterCatalogForBuildMode(
  classes: ClassDefinition[],
  mode: ClassBuildMode,
): ClassDefinition[] {
  if (mode === 'multiclass') {
    return classes
  }

  return classes.filter((definition) => definition.catalogStatus !== 'preview')
}

export function isPreviewClassDefinition(definition: ClassDefinition): boolean {
  return definition.catalogStatus === 'preview'
}

export function formatMulticlassLevelSummary(
  instances: readonly CharacterClassSelection[],
  classNamesById: Map<string, string>,
): string {
  return instances
    .map(
      (instance) =>
        `${classNamesById.get(instance.classId) ?? instance.classId} ${instance.level}`,
    )
    .join(' + ')
}

export function toEffectiveInstance(
  committed: CharacterClassSelection | undefined,
  draft: ReturnType<typeof instanceDraftToClassInstance> | undefined,
): CharacterClassSelection | null {
  if (draft !== undefined) {
    return draft
  }

  return committed ?? null
}
