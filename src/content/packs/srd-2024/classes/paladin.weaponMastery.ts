import {
  createWeaponMasteryChoices,
  type WeaponMasterySlotThreshold,
} from '../../../../domain/class/weaponMastery'

/** Paladin Weapon Mastery slot unlocks (SRD 2024) — two weapons at level 1 only. */
export const PALADIN_WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 2, choiceId: 'weapon-mastery' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

const PALADIN_WEAPON_MASTERY_FIXTURE_POOL = [
  'longsword',
  'javelin',
  'warhammer',
  'battleaxe',
] as const

/** Deterministic Paladin Weapon Mastery picks for tests and fixtures. */
export function createPaladinWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    PALADIN_WEAPON_MASTERY_SLOT_THRESHOLDS,
    PALADIN_WEAPON_MASTERY_FIXTURE_POOL,
  )
}
