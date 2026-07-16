import {
  createWeaponMasteryChoices,
  type WeaponMasterySlotThreshold,
} from '../../../../domain/class/weaponMastery'

/** Fighter Weapon Mastery slot unlocks (SRD 2024). */
export const FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 3, choiceId: 'weapon-mastery' },
  { level: 4, total: 4, choiceId: 'weapon-mastery-weapons-4' },
  { level: 10, total: 5, choiceId: 'weapon-mastery-weapons-5' },
  { level: 16, total: 6, choiceId: 'weapon-mastery-weapons-6' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

const FIGHTER_WEAPON_MASTERY_FIXTURE_POOL = [
  'longsword',
  'shortbow',
  'battleaxe',
  'greatsword',
  'rapier',
  'warhammer',
] as const

/** Deterministic Fighter Weapon Mastery picks for tests and fixtures. */
export function createFighterWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS,
    FIGHTER_WEAPON_MASTERY_FIXTURE_POOL,
  )
}
