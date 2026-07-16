import { describe, expect, it } from 'vitest'
import {
  createFighterWeaponMasteryChoices,
  FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS,
} from './fighter.weaponMastery'
import { getWeaponMasterySlotCount } from '../../../../domain/class/weaponMastery'

describe('fighter weapon mastery schedule', () => {
  it('uses the SRD 2024 Fighter slot totals', () => {
    expect(
      getWeaponMasterySlotCount(1, FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(3)
    expect(
      getWeaponMasterySlotCount(4, FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(4)
    expect(
      getWeaponMasterySlotCount(10, FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(5)
    expect(
      getWeaponMasterySlotCount(16, FIGHTER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(6)
  })

  it('builds Fighter fixture mastery choices on the 3/4/5/6 schedule', () => {
    expect(Object.keys(createFighterWeaponMasteryChoices(16))).toEqual([
      'weapon-mastery',
      'weapon-mastery-weapons-4',
      'weapon-mastery-weapons-5',
      'weapon-mastery-weapons-6',
    ])
  })
})
