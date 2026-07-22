import type { AbilityId } from '../abilities/types'
import { parseAsiChoice } from '../class/abilityScoreImprovement'
import type { SkillId } from '../skills/types'
import { parseSkillOrToolProficiencyOptionId } from './skillOrToolProficiency'
import type { FeatDefinition } from './types'

export type FeatProficiencyGrant = {
  kind: 'skill' | 'tool'
  id: string
  sourceFeatId: string
  sourceLabel: string
}

/**
 * Resolve skill/tool proficiency grants from a feat's completed multi-select
 * proficiency choices.
 */
export function resolveFeatProficiencyGrants(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
  sourceLabel: string,
): FeatProficiencyGrant[] {
  const grants: FeatProficiencyGrant[] = []

  for (const choice of definition.choices) {
    if (choice.type !== 'multi-select') {
      continue
    }
    if (choice.optionSource !== 'skill-or-tool-proficiency') {
      continue
    }

    const value = choices[choice.id]
    const ids =
      value === undefined
        ? []
        : typeof value === 'string'
          ? [value]
          : value

    for (const optionId of ids) {
      const parsed = parseSkillOrToolProficiencyOptionId(optionId)
      if (parsed === null) {
        continue
      }
      grants.push({
        kind: parsed.kind,
        id: parsed.kind === 'skill' ? parsed.skillId : parsed.toolId,
        sourceFeatId: definition.id,
        sourceLabel,
      })
    }
  }

  return grants
}

export function collectSkillIdsFromFeatChoices(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
): SkillId[] {
  return resolveFeatProficiencyGrants(definition, choices, definition.name)
    .filter((grant) => grant.kind === 'skill')
    .map((grant) => grant.id as SkillId)
}

export function collectToolIdsFromFeatChoices(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
): string[] {
  return resolveFeatProficiencyGrants(definition, choices, definition.name)
    .filter((grant) => grant.kind === 'tool')
    .map((grant) => grant.id)
}

/**
 * Ability bonuses from an ASI-feat nested `asi-score-increase` choice.
 */
export function collectAsiFeatAbilityBonuses(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
): Partial<Record<AbilityId, number>> {
  const bonuses: Partial<Record<AbilityId, number>> = {}

  for (const choice of definition.choices) {
    if (choice.type !== 'asi-score-increase') {
      continue
    }
    const value = choices[choice.id]
    if (typeof value !== 'string') {
      continue
    }
    const parsed = parseAsiChoice(value)
    if (parsed?.kind === 'plus-2') {
      bonuses[parsed.abilityId] = (bonuses[parsed.abilityId] ?? 0) + 2
    } else if (parsed?.kind === 'plus-1-1') {
      for (const abilityId of parsed.abilityIds) {
        bonuses[abilityId] = (bonuses[abilityId] ?? 0) + 1
      }
    }
  }

  return bonuses
}
