import type { AbilityScores } from '../../domain/types'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import type { CharacterClassSelection } from '../../domain/class/types'
import type { ClassDefinition } from '../../domain/class/types'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import { resolveClassEffects } from '../class/resolveClassEffects'
import type { ResolvedCharacterFeats } from './resolveCharacterFeatGrants'
import { collectTakenFeatIdsForClassChoice } from './resolveCharacterFeatGrants'
import { isFightingStyleFeatGrantChoice } from '../../domain/class/fightingStyle'

export type BuildFeatEligibilityContextInput = {
  characterLevel: number
  abilityScores: AbilityScores
  classes: readonly CharacterClassSelection[]
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>
  /** Already-resolved grants; when omitted, takenFeatIds starts empty. */
  resolvedFeats?: ResolvedCharacterFeats
  exceptClassChoice?: { instanceId: string; choiceId: string }
}

export function characterHasSpellcasting(
  classes: readonly CharacterClassSelection[],
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>,
): boolean {
  for (const instance of classes) {
    const definition = classDefinitionsById.get(instance.classId)
    if (definition?.spellcasting !== undefined) {
      return true
    }
  }

  return false
}

export function characterHasFightingStyle(
  classes: readonly CharacterClassSelection[],
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>,
): boolean {
  for (const instance of classes) {
    const definition = classDefinitionsById.get(instance.classId)
    if (definition === undefined) {
      continue
    }

    const available = getChoicesAvailableAtLevel(
      definition,
      instance.level,
      instance.choices,
    )
    if (available.some((choice) => isFightingStyleFeatGrantChoice(choice))) {
      return true
    }

    // Legacy: style effects on class options (pre-P2.2 saves / fixtures)
    const effects = resolveClassEffects(definition, {
      classId: instance.classId,
      level: instance.level,
      choices: instance.choices,
    })
    if (effects.some((effect) => effect.kind === 'fighting-style')) {
      return true
    }
  }

  return false
}

export function buildFeatEligibilityContext(
  input: BuildFeatEligibilityContextInput,
): FeatEligibilityContext {
  const takenFeatIds =
    input.resolvedFeats === undefined
      ? []
      : input.exceptClassChoice !== undefined
        ? collectTakenFeatIdsForClassChoice({
            resolved: input.resolvedFeats,
            instanceId: input.exceptClassChoice.instanceId,
            choiceId: input.exceptClassChoice.choiceId,
          })
        : input.resolvedFeats.takenFeatIds

  return {
    characterLevel: input.characterLevel,
    abilityScores: input.abilityScores,
    hasSpellcasting: characterHasSpellcasting(
      input.classes,
      input.classDefinitionsById,
    ),
    hasFightingStyle: characterHasFightingStyle(
      input.classes,
      input.classDefinitionsById,
    ),
    takenFeatIds,
  }
}
