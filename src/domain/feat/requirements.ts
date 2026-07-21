import type { AbilityId } from '../abilities/types'
import type { FeatCategory, FeatPrerequisite } from './types'

export type FeatRequirement =
  | { kind: 'min-character-level'; level: number }
  | { kind: 'min-ability-score'; ability: AbilityId; minimum: number }
  | {
      kind: 'min-ability-score-any'
      abilities: readonly AbilityId[]
      minimum: number
    }
  | { kind: 'has-spellcasting' }
  | { kind: 'has-fighting-style' }

/** Category defaults applied when a feat has no explicit structured requirements. */
export function getCategoryDefaultRequirements(
  category: FeatCategory,
): FeatRequirement[] {
  switch (category) {
    case 'general':
      return [{ kind: 'min-character-level', level: 4 }]
    case 'fighting-style':
      return [{ kind: 'has-fighting-style' }]
    case 'epic-boon':
      return [{ kind: 'min-character-level', level: 19 }]
    case 'origin':
      return []
  }
}

/**
 * Effective requirements for eligibility: explicit `requirements` prerequisite,
 * otherwise category defaults. `text` prerequisites remain display-only.
 */
export function getEffectiveFeatRequirements(
  category: FeatCategory,
  prerequisite: FeatPrerequisite,
): FeatRequirement[] {
  if (prerequisite.kind === 'requirements') {
    return prerequisite.requirements
  }

  return getCategoryDefaultRequirements(category)
}

export function formatFeatRequirement(requirement: FeatRequirement): string {
  switch (requirement.kind) {
    case 'min-character-level':
      return `Level ${requirement.level}+`
    case 'min-ability-score':
      return `${requirement.ability} ${requirement.minimum}+`
    case 'min-ability-score-any':
      return `${requirement.abilities.join(' or ')} ${requirement.minimum}+`
    case 'has-spellcasting':
      return 'Spellcasting Feature'
    case 'has-fighting-style':
      return 'Fighting Style Feature'
  }
}
