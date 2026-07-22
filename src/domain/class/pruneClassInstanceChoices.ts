import { pruneOrphanFeatGrantChoiceKeys } from '../feat/featGrantChoiceStorage'
import { isAbilityScoreImprovementChoiceId } from './abilityScoreImprovement'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from './choiceAvailability'
import { isEpicBoonChoiceId } from './epicBoon'
import { isFightingStyleFeatGrantChoiceId } from './fightingStyle'
import type {
  CharacterClassSelection,
  ClassDefinition,
  ClassLevel,
} from './types'
import { withLevelAdjustedChoiceLimits } from './weaponMastery'

function collectActiveFeatGrantSlotIds(
  choices: Record<string, string | string[] | undefined>,
): Set<string> {
  const slots = new Set<string>()

  for (const choiceId of Object.keys(choices)) {
    if (
      isAbilityScoreImprovementChoiceId(choiceId) ||
      isEpicBoonChoiceId(choiceId) ||
      isFightingStyleFeatGrantChoiceId(choiceId)
    ) {
      slots.add(choiceId)
    }
  }

  return slots
}

export function pruneClassInstanceChoicesForLevel(
  instance: CharacterClassSelection,
  definition: ClassDefinition,
  newLevel: ClassLevel,
): CharacterClassSelection {
  const availableChoices = getChoicesAvailableAtLevel(
    definition,
    newLevel,
    instance.choices,
  )
  const prunedChoices = pruneClassChoicesForLevel(
    instance.choices,
    availableChoices,
  )

  // Re-evaluate availability after pruning (e.g. subclass change drops dependents).
  const availableAfterPrune = getChoicesAvailableAtLevel(
    definition,
    newLevel,
    prunedChoices,
  )
  let finalChoices = pruneClassChoicesForLevel(
    prunedChoices,
    availableAfterPrune,
  )

  for (const choice of availableAfterPrune) {
    const adjusted = withLevelAdjustedChoiceLimits(choice, newLevel)

    if (adjusted.type !== 'multi-select') {
      continue
    }

    const value = finalChoices[adjusted.id]

    if (Array.isArray(value) && value.length > adjusted.max) {
      finalChoices[adjusted.id] = value.slice(0, adjusted.max)
    }
  }

  finalChoices = pruneOrphanFeatGrantChoiceKeys(
    finalChoices,
    collectActiveFeatGrantSlotIds(finalChoices),
  )

  return {
    ...instance,
    level: newLevel,
    choices: finalChoices,
  }
}
