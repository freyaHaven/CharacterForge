import type {
  ClassChoice,
  ClassChoiceOption,
  ClassChoiceValue,
  ClassDefinition,
  ClassOptionFeature,
} from '../../domain/class/types'

function isSubclassChoice(choice: ClassChoice): boolean {
  return choice.id.endsWith('-subclass') && choice.type === 'single-select'
}

export function getSelectedSubclassOption(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
): ClassChoiceOption | null {
  const subclassChoice = definition.choices.find(isSubclassChoice)

  if (subclassChoice?.type !== 'single-select') {
    return null
  }

  const selectedValue = choices[subclassChoice.id]
  if (typeof selectedValue !== 'string' || selectedValue.length === 0) {
    return null
  }

  return (
    subclassChoice.options.find((option) => option.id === selectedValue) ?? null
  )
}

export function getSubclassFeaturesUpToLevel(
  option: ClassChoiceOption | null,
  level: number,
): ClassOptionFeature[] {
  if (option?.features === undefined) {
    return []
  }

  return option.features.filter((feature) => feature.level <= level)
}

export function getSubclassFeaturesAtLevel(
  option: ClassChoiceOption | null,
  level: number,
): ClassOptionFeature[] {
  if (option?.features === undefined) {
    return []
  }

  return option.features.filter((feature) => feature.level === level)
}

export function isSubclassPlaceholderFeature(featureId: string): boolean {
  return featureId.includes('-subclass-feature-')
}
