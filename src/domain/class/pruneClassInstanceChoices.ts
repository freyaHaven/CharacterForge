import { pruneOrphanFeatGrantChoiceKeys } from '../feat/featGrantChoiceStorage'
import { isAbilityScoreImprovementChoiceId } from './abilityScoreImprovement'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from './choiceAvailability'
import { pruneIneligibleMultiSelectOptions } from './classOptionPrerequisites'
import { isCatalogueFeatGrantChoiceId } from './catalogueFeatGrant'
import { isEpicBoonChoiceId } from './epicBoon'
import { isFightingStyleFeatGrantChoiceId } from './fightingStyle'
import {
  isInvocationChoiceStorageKey,
  pruneAllInvocationChoiceKeys,
  pruneOrphanInvocationChoiceKeys,
} from './invocationChoiceStorage'
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
      isCatalogueFeatGrantChoiceId(choiceId) ||
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

    if (!Array.isArray(value)) {
      continue
    }

    let nextValue = value
    if (nextValue.length > adjusted.max) {
      nextValue = nextValue.slice(0, adjusted.max)
    }

    nextValue = pruneIneligibleMultiSelectOptions(
      adjusted,
      nextValue,
      newLevel,
      finalChoices,
    )

    finalChoices[adjusted.id] = nextValue
    finalChoices = pruneOrphanInvocationChoiceKeys(
      finalChoices,
      adjusted.id,
      new Set(nextValue),
    )
  }

  // Drop invocation companions when parent multi-select is no longer available.
  const availableIds = new Set(availableAfterPrune.map((choice) => choice.id))
  for (const key of Object.keys(finalChoices)) {
    if (!isInvocationChoiceStorageKey(key)) {
      continue
    }
    // Parent gone entirely → strip all invocation keys once after loop.
  }

  const hasInvocationParent = availableAfterPrune.some(
    (choice) => choice.type === 'multi-select',
  )
  if (!hasInvocationParent) {
    // Keep keys only if some multi-select remains; otherwise clear orphans tied
    // to missing parents via per-choice prune above. Full wipe when no parents.
    const stillHasParentSelection = Object.keys(finalChoices).some((id) =>
      availableIds.has(id),
    )
    if (!stillHasParentSelection) {
      finalChoices = pruneAllInvocationChoiceKeys(finalChoices)
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
