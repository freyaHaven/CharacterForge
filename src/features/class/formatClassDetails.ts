import type { AbilityId } from '../../domain/abilities/types'
import type {
  ArmorProficiency,
  ClassDefinition,
  WeaponProficiency,
} from '../../domain/class/types'

const ABILITY_LABELS: Record<AbilityId, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

const ARMOR_LABELS: Record<ArmorProficiency, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  shield: 'Shield',
}

const WEAPON_LABELS: Record<WeaponProficiency, string> = {
  simple: 'Simple',
  martial: 'Martial',
}

export function formatAbilityLabel(abilityId: AbilityId): string {
  return ABILITY_LABELS[abilityId]
}

export function formatAbilityList(abilities: AbilityId[]): string {
  return abilities.map(formatAbilityLabel).join(', ')
}

export function formatAbilityChipLabels(abilities: AbilityId[]): string[] {
  return abilities.map(formatAbilityLabel)
}

export function formatArmorProficiencies(
  proficiencies: ClassDefinition['proficiencies']['armor'],
): string {
  return proficiencies.map((entry) => ARMOR_LABELS[entry]).join(', ')
}

export function formatArmorProficiencyChipLabels(
  proficiencies: ClassDefinition['proficiencies']['armor'],
): string[] {
  return proficiencies.map((entry) => ARMOR_LABELS[entry])
}

export function formatWeaponProficiencies(
  proficiencies: ClassDefinition['proficiencies']['weapons'],
): string {
  return proficiencies.map((entry) => WEAPON_LABELS[entry]).join(', ')
}

export function formatWeaponProficiencyChipLabels(
  proficiencies: ClassDefinition['proficiencies']['weapons'],
): string[] {
  return proficiencies.map((entry) => WEAPON_LABELS[entry])
}

export function formatHitDie(definition: ClassDefinition): string {
  return `d${definition.hitDie.sides}`
}
