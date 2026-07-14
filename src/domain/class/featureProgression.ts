import type {
  ClassDefinition,
  ClassFeature,
  ClassLevel,
  ClassLevelFeatures,
} from './types'

export function getClassFeatureProgressionUpToLevel(
  definition: ClassDefinition,
  level: ClassLevel,
): ClassLevelFeatures[] {
  return definition.featureProgression
    .filter((entry) => entry.level <= level)
    .sort((left, right) => left.level - right.level)
}

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
