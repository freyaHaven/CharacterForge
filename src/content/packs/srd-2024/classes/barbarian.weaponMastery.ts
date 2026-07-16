import {
  createWeaponMasteryChoices,
  type WeaponMasterySlotThreshold,
} from '../../../../domain/class/weaponMastery'

/** Barbarian Weapon Mastery slot unlocks (SRD 2024). */
export const BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 2, choiceId: 'weapon-mastery' },
  { level: 4, total: 3, choiceId: 'weapon-mastery-weapons-3' },
  { level: 10, total: 4, choiceId: 'weapon-mastery-weapons-4' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

const BARBARIAN_WEAPON_MASTERY_FIXTURE_POOL = [
  'greataxe',
  'handaxe',
  'battleaxe',
  'greatsword',
  'longsword',
  'warhammer',
] as const

/** Deterministic Barbarian Weapon Mastery picks for tests and fixtures. */
export function createBarbarianWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS,
    BARBARIAN_WEAPON_MASTERY_FIXTURE_POOL,
  )
}
