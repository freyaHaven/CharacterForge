import { getChoicesAvailableAtLevel, pruneClassChoicesForLevel } from './choiceAvailability'
import type {
  CharacterClassSelection,
  ClassDefinition,
  ClassLevel,
} from './types'

export function pruneClassInstanceChoicesForLevel(
  instance: CharacterClassSelection,
  definition: ClassDefinition,
  newLevel: ClassLevel,
): CharacterClassSelection {
  const availableChoices = getChoicesAvailableAtLevel(definition, newLevel)

  return {
    ...instance,
    level: newLevel,
    choices: pruneClassChoicesForLevel(instance.choices, availableChoices),
  }
}
