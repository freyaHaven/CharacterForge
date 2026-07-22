import type { FeatDefinition, FeatEffect } from '../../domain/feat/types'
import type { ResolvedFeatGrant } from '../character/resolveCharacterFeatGrants'

export function resolveFeatDefinitionEffects(
  definition: FeatDefinition,
): FeatEffect[] {
  return definition.effects !== undefined ? [...definition.effects] : []
}

/**
 * Collect creator-time feat effects from resolved grants + definitions.
 */
export function resolveCharacterFeatEffects(
  grants: readonly ResolvedFeatGrant[],
  definitionsById: ReadonlyMap<string, FeatDefinition>,
): FeatEffect[] {
  const effects: FeatEffect[] = []

  for (const grant of grants) {
    const definition = definitionsById.get(grant.featId)
    if (definition === undefined) {
      continue
    }
    effects.push(...resolveFeatDefinitionEffects(definition))
  }

  return effects
}

export function hasInitiativeProficiency(
  effects: readonly FeatEffect[],
): boolean {
  return effects.some((effect) => effect.kind === 'initiative-proficiency')
}

/**
 * Sum unique armor-class-bonus feat effects that apply given wear state.
 * Duplicate grants of the same non-repeatable feat are already blocked upstream;
 * this still caps by summing distinct effect descriptors once each.
 */
export function resolveArmorClassBonusFromFeatEffects(
  effects: readonly FeatEffect[],
  wearingArmor: boolean,
): number {
  let bonus = 0
  const seen = new Set<string>()

  for (const effect of effects) {
    if (effect.kind !== 'armor-class-bonus') {
      continue
    }

    if (effect.when === 'wearing-armor' && !wearingArmor) {
      continue
    }

    const key = `${effect.amount}:${effect.when ?? 'always'}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    bonus += effect.amount
  }

  return bonus
}
