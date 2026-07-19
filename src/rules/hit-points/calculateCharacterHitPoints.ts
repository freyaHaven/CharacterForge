import type { ClassDefinition, CharacterClassSelection } from '../../domain/class/types'
import type { AbilityScores } from '../../domain/types'
import type { SpeciesDefinition, SpeciesSelection } from '../../domain/species/types'
import {
  resolveHitPointMaximum,
  type ResolvedHitPoints,
} from './resolveHitPointMaximum'

export type { ResolvedHitPoints, HitPointLevelBreakdown } from './resolveHitPointMaximum'

/**
 * Shared Hit Point maximum derivation for Overview and future sheet export.
 *
 * Prefer this entry point over calling {@link resolveHitPointMaximum} directly
 * so consumers share one character-facing API.
 */
export function calculateCharacterHitPoints(input: {
  classes: readonly CharacterClassSelection[]
  startingClassInstanceId: string | null
  classDefinitionsById: ReadonlyMap<string, ClassDefinition>
  abilityScores: AbilityScores
  speciesDefinition: SpeciesDefinition | null
  speciesSelection: SpeciesSelection | null
}): ResolvedHitPoints {
  return resolveHitPointMaximum(input)
}
