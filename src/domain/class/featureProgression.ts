import type { ClassDefinition, ClassFeature, ClassLevel } from './types'

export function getClassFeaturesForLevel(
  definition: ClassDefinition,
  level: ClassLevel,
): ClassFeature[] {
  return (
    definition.featureProgression.find((entry) => entry.level === level)
      ?.features ?? []
  )
}

export function getClassFeaturesUpToLevel(
  definition: ClassDefinition,
  level: ClassLevel,
): ClassFeature[] {
  return definition.featureProgression
    .filter((entry) => entry.level <= level)
    .flatMap((entry) => entry.features)
}
