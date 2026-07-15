import { getAbilityModifier } from '../../domain/abilities'
import type { AbilityScores } from '../../domain/types'

export const ABILITY_SCORE_ENTRIES = [
  { key: 'strength' as const, abbreviation: 'STR', label: 'Strength' },
  { key: 'dexterity' as const, abbreviation: 'DEX', label: 'Dexterity' },
  { key: 'constitution' as const, abbreviation: 'CON', label: 'Constitution' },
  { key: 'intelligence' as const, abbreviation: 'INT', label: 'Intelligence' },
  { key: 'wisdom' as const, abbreviation: 'WIS', label: 'Wisdom' },
  { key: 'charisma' as const, abbreviation: 'CHA', label: 'Charisma' },
]

export type AbilityScoreKey = keyof AbilityScores

export function formatAbilityModifierDisplay(score: number | null): string {
  if (score === null) {
    return '—'
  }

  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function formatAbilityScoreDisplay(score: number | null): string {
  return score === null ? '—' : String(score)
}
