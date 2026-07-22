import { isFeatGrantChoiceStorageKey } from '../feat/featGrantChoiceStorage'
import { matchesRequiredOptionId } from './classOptionPrerequisites'
import { isInvocationChoiceStorageKey } from './invocationChoiceStorage'
import type { ClassChoiceValue, ClassDefinition, ClassLevel } from './types'

function choiceHasOptionSelected(
  selectedChoices: Record<string, ClassChoiceValue>,
  choiceId: string,
  optionId: string,
): boolean {
  const selected = selectedChoices[choiceId]
  if (selected === undefined) {
    return false
  }

  if (typeof selected === 'string') {
    return matchesRequiredOptionId(selected, optionId)
  }

  return selected.some((id) => matchesRequiredOptionId(id, optionId))
}

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
      return choiceHasOptionSelected(
        selectedChoices,
        choice.availableWhen.choiceId,
        choice.availableWhen.optionId,
      )
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
        availableIds.has(choiceId) ||
        isFeatGrantChoiceStorageKey(choiceId) ||
        isInvocationChoiceStorageKey(choiceId),
    ),
  )
}
