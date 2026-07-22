import { getAbilityModifier } from '../abilities'
import type { AbilityId } from '../abilities/types'
import type { SkillId } from '../skills/types'

export const ABILITY_ABBREVIATIONS: Record<AbilityId, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
}

/** 5e proficiency bonus by character level (1–20). */
export function getProficiencyBonus(level: number): number {
  const clamped = Math.min(20, Math.max(1, Math.floor(level)))
  return Math.ceil(clamped / 4) + 1
}

export function formatSignedModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

export const SKILL_ABILITY_MAP: Record<SkillId, AbilityId> = {
  acrobatics: 'dexterity',
  'animal-handling': 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  'sleight-of-hand': 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
}

export type ProficiencyRank = 'none' | 'proficient' | 'expertise'

export type GetSkillModifierOptions = {
  /**
   * Jack of All Trades: add floor(PB/2) when the skill has no proficiency.
   * Never stacks with proficient or expertise.
   */
  jackOfAllTrades?: boolean
}

export function getSkillModifier(
  abilityScore: number,
  proficiencyBonus: number,
  rank: ProficiencyRank,
  options?: GetSkillModifierOptions,
): number {
  const abilityModifier = getAbilityModifier(abilityScore)

  if (rank === 'expertise') {
    return abilityModifier + proficiencyBonus * 2
  }

  if (rank === 'proficient') {
    return abilityModifier + proficiencyBonus
  }

  if (options?.jackOfAllTrades === true) {
    return abilityModifier + Math.floor(proficiencyBonus / 2)
  }

  return abilityModifier
}

export function getSavingThrowModifier(
  abilityScore: number,
  proficiencyBonus: number,
  proficient: boolean,
): number {
  const abilityModifier = getAbilityModifier(abilityScore)
  return proficient ? abilityModifier + proficiencyBonus : abilityModifier
}

export function getPassiveScore(skillModifier: number): number {
  return 10 + skillModifier
}
