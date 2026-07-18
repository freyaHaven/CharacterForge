import {
  createWeaponMasteryChoices,
  type WeaponMasterySlotThreshold,
} from '../../../../domain/class/weaponMastery'

/** Ranger Weapon Mastery slot unlocks (SRD 2024) — two weapons at level 1 only. */
export const RANGER_WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 2, choiceId: 'weapon-mastery' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

const RANGER_WEAPON_MASTERY_FIXTURE_POOL = [
  'longbow',
  'shortsword',
  'scimitar',
  'longsword',
] as const

/** Deterministic Ranger Weapon Mastery picks for tests and fixtures. */
export function createRangerWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    RANGER_WEAPON_MASTERY_SLOT_THRESHOLDS,
    RANGER_WEAPON_MASTERY_FIXTURE_POOL,
  )
}
