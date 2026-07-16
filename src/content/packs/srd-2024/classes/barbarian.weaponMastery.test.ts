import { describe, expect, it } from 'vitest'
import {
  BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS,
  createBarbarianWeaponMasteryChoices,
} from './barbarian.weaponMastery'
import { getWeaponMasterySlotCount } from '../../../../domain/class/weaponMastery'

describe('barbarian weapon mastery schedule', () => {
  it('uses the SRD 2024 Barbarian slot totals', () => {
    expect(
      getWeaponMasterySlotCount(1, BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
    expect(
      getWeaponMasterySlotCount(4, BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(3)
    expect(
      getWeaponMasterySlotCount(10, BARBARIAN_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(4)
  })

  it('builds Barbarian fixture mastery choices on the 2/3/4 schedule', () => {
    expect(createBarbarianWeaponMasteryChoices(1)).toEqual({
      'weapon-mastery': ['greataxe', 'handaxe'],
    })
    expect(createBarbarianWeaponMasteryChoices(4)).toEqual({
      'weapon-mastery': ['greataxe', 'handaxe'],
      'weapon-mastery-weapons-3': ['battleaxe'],
    })
    expect(createBarbarianWeaponMasteryChoices(10)).toEqual({
      'weapon-mastery': ['greataxe', 'handaxe'],
      'weapon-mastery-weapons-3': ['battleaxe'],
      'weapon-mastery-weapons-4': ['greatsword'],
    })
  })
})
