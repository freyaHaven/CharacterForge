import type {
  ClassDefinition,
  ClassLevel,
  DeferredCharacterRequirement,
} from '../../domain/class/types'

export function resolveDeferredCharacterRequirements(
  definition: ClassDefinition,
  level: ClassLevel,
): DeferredCharacterRequirement[] {
  return definition.deferredRequirements
    .filter((requirement) => requirement.level <= level)
    .sort((left, right) => {
      if (left.level !== right.level) {
        return left.level - right.level
      }

      return left.label.localeCompare(right.label)
    })
}
