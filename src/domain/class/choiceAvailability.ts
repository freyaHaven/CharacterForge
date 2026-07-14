import type {
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassLevel,
} from './types'

export function getChoicesAvailableAtLevel(
  definition: ClassDefinition,
  level: ClassLevel,
): ClassChoice[] {
  return definition.choices.filter((choice) => choice.level <= level)
}

export function pruneClassChoicesForLevel(
  choices: Record<string, ClassChoiceValue>,
  availableChoices: readonly ClassChoice[],
): Record<string, ClassChoiceValue> {
  const availableIds = new Set(availableChoices.map((choice) => choice.id))

  return Object.fromEntries(
    Object.entries(choices).filter(([choiceId]) => availableIds.has(choiceId)),
  )
}
