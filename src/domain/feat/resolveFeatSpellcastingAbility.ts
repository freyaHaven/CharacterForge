import { isAbilityId, type AbilityId } from '../abilities/types'
import type { FeatSpellcasting } from '../spell/types'

/**
 * Resolve a feat's spellcasting ability from a fixed value or nested choice.
 * Returns null when the required ability choice is incomplete or invalid.
 */
export function resolveFeatSpellcastingAbility(
  spellcasting: FeatSpellcasting,
  choices: Record<string, string | string[]>,
): AbilityId | null {
  if (spellcasting.abilityFromChoiceId !== undefined) {
    const value = choices[spellcasting.abilityFromChoiceId]
    if (typeof value === 'string' && isAbilityId(value)) {
      return value
    }
    return null
  }

  return spellcasting.ability ?? null
}
