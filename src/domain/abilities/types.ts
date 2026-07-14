import type { AbilityScores } from '../types'

export type AbilityId = keyof AbilityScores

export const ABILITY_IDS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
] as const satisfies readonly AbilityId[]

export function isAbilityId(value: unknown): value is AbilityId {
  return (
    typeof value === 'string' &&
    (ABILITY_IDS as readonly string[]).includes(value)
  )
}
