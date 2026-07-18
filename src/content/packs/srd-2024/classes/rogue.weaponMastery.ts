import {
  createWeaponMasteryChoices,
  type WeaponMasterySlotThreshold,
} from '../../../../domain/class/weaponMastery'

/** Rogue Weapon Mastery slot unlocks (SRD 2024) — two weapons at level 1 only. */
export const ROGUE_WEAPON_MASTERY_SLOT_THRESHOLDS = [
  { level: 1, total: 2, choiceId: 'weapon-mastery' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

const ROGUE_WEAPON_MASTERY_FIXTURE_POOL = [
  'dagger',
  'shortbow',
  'shortsword',
  'rapier',
] as const

/** Deterministic Rogue Weapon Mastery picks for tests and fixtures. */
export function createRogueWeaponMasteryChoices(
  level: number,
): Record<string, string[]> {
  return createWeaponMasteryChoices(
    level,
    ROGUE_WEAPON_MASTERY_SLOT_THRESHOLDS,
    ROGUE_WEAPON_MASTERY_FIXTURE_POOL,
  )
}
