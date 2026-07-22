import { isFeatGrantChoiceStorageKey } from '../feat/featGrantChoiceStorage'
import type { ClassChoiceValue, ClassDefinition, ClassLevel } from './types'

export function getChoicesAvailableAtLevel(
  definition: ClassDefinition,
  level: ClassLevel,
  selectedChoices: Record<string, ClassChoiceValue> = {},
) {
  return definition.choices.filter((choice) => {
    if (choice.level > level) {
      return false
    }

    if (choice.availableWhen !== undefined) {
      const selected = selectedChoices[choice.availableWhen.choiceId]
      return selected === choice.availableWhen.optionId
    }

    return true
  })
}

export function pruneClassChoicesForLevel(
  choices: Record<string, ClassChoiceValue>,
  availableChoices: readonly { id: string }[],
): Record<string, ClassChoiceValue> {
  const availableIds = new Set(availableChoices.map((choice) => choice.id))

  return Object.fromEntries(
    Object.entries(choices).filter(
      ([choiceId]) =>
        availableIds.has(choiceId) || isFeatGrantChoiceStorageKey(choiceId),
    ),
  )
}
