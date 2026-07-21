import type { AbilityScores } from '../types'
import { getEffectiveFeatRequirements, type FeatRequirement } from './requirements'
import type { FeatDefinition, FeatPrerequisite } from './types'

export type FeatEligibility =
  | { eligible: true }
  | { eligible: false; reason: string }

export type FeatEligibilityContext = {
  characterLevel: number
  abilityScores: AbilityScores
  hasSpellcasting: boolean
  hasFightingStyle: boolean
  /** Feat ids already granted (excluding the slot being edited). */
  takenFeatIds: readonly string[]
}

const EMPTY_ABILITY_SCORES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

/** Permissive context for catalogue surfaces that lack character state. */
export const EMPTY_FEAT_ELIGIBILITY_CONTEXT: FeatEligibilityContext = {
  characterLevel: 20,
  abilityScores: EMPTY_ABILITY_SCORES,
  hasSpellcasting: true,
  hasFightingStyle: true,
  takenFeatIds: [],
}

function evaluateRequirement(
  requirement: FeatRequirement,
  context: FeatEligibilityContext,
): FeatEligibility {
  switch (requirement.kind) {
    case 'min-character-level':
      if (context.characterLevel < requirement.level) {
        return {
          eligible: false,
          reason: `Requires character level ${requirement.level}+`,
        }
      }
      return { eligible: true }

    case 'min-ability-score':
      if (context.abilityScores[requirement.ability] < requirement.minimum) {
        return {
          eligible: false,
          reason: `Requires ${requirement.ability} ${requirement.minimum}+`,
        }
      }
      return { eligible: true }

    case 'min-ability-score-any': {
      const meets = requirement.abilities.some(
        (ability) => context.abilityScores[ability] >= requirement.minimum,
      )
      if (!meets) {
        return {
          eligible: false,
          reason: `Requires ${requirement.abilities.join(' or ')} ${requirement.minimum}+`,
        }
      }
      return { eligible: true }
    }

    case 'has-spellcasting':
      if (!context.hasSpellcasting) {
        return {
          eligible: false,
          reason: 'Requires the Spellcasting feature',
        }
      }
      return { eligible: true }

    case 'has-fighting-style':
      if (!context.hasFightingStyle) {
        return {
          eligible: false,
          reason: 'Requires the Fighting Style feature',
        }
      }
      return { eligible: true }
  }
}

/**
 * Evaluates whether a feat can be selected for the current character.
 * When context is omitted, category/explicit requirements that need character
 * state are treated permissively (legacy FeatPicker / catalogue-only surfaces).
 */
export function evaluateFeatEligibility(
  definition: FeatDefinition,
  context: FeatEligibilityContext = EMPTY_FEAT_ELIGIBILITY_CONTEXT,
): FeatEligibility {
  const requirements = getEffectiveFeatRequirements(
    definition.category,
    definition.prerequisite,
  )

  for (const requirement of requirements) {
    const result = evaluateRequirement(requirement, context)
    if (!result.eligible) {
      return result
    }
  }

  const priorTakes = context.takenFeatIds.filter(
    (featId) => featId === definition.id,
  ).length

  if (priorTakes > 0 && !definition.repeatable) {
    return {
      eligible: false,
      reason: 'You already have this feat',
    }
  }

  return { eligible: true }
}

export function formatFeatPrerequisite(
  prerequisite: FeatPrerequisite,
): string {
  if (prerequisite.kind === 'none') {
    return 'None'
  }

  return prerequisite.summary
}
