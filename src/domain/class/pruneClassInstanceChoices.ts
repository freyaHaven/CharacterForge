import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from './choiceAvailability'
import type {
  CharacterClassSelection,
  ClassDefinition,
  ClassLevel,
} from './types'
import { withLevelAdjustedChoiceLimits } from './weaponMastery'

export function pruneClassInstanceChoicesForLevel(
  instance: CharacterClassSelection,
  definition: ClassDefinition,
  newLevel: ClassLevel,
): CharacterClassSelection {
  const availableChoices = getChoicesAvailableAtLevel(definition, newLevel)
  const prunedChoices = pruneClassChoicesForLevel(
    instance.choices,
    availableChoices,
  )

  for (const choice of availableChoices) {
    const adjusted = withLevelAdjustedChoiceLimits(choice, newLevel)

    if (adjusted.type !== 'multi-select') {
      continue
    }

    const value = prunedChoices[adjusted.id]

    if (Array.isArray(value) && value.length > adjusted.max) {
      prunedChoices[adjusted.id] = value.slice(0, adjusted.max)
    }
  }

  return {
    ...instance,
    level: newLevel,
    choices: prunedChoices,
  }
}
