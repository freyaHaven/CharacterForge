import { describe, expect, it } from 'vitest'
import {
  createRogueWeaponMasteryChoices,
  ROGUE_WEAPON_MASTERY_SLOT_THRESHOLDS,
} from '../rogue.weaponMastery'
import { getWeaponMasterySlotCount } from '../../../../../domain/class/weaponMastery'

describe('rogue weapon mastery schedule', () => {
  it('uses two mastery weapons from level 1 with no further unlocks', () => {
    expect(
      getWeaponMasterySlotCount(1, ROGUE_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
    expect(
      getWeaponMasterySlotCount(20, ROGUE_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
  })

  it('builds Rogue fixture mastery choices', () => {
    expect(createRogueWeaponMasteryChoices(1)).toEqual({
      'weapon-mastery': ['dagger', 'shortbow'],
    })
    expect(createRogueWeaponMasteryChoices(10)).toEqual({
      'weapon-mastery': ['dagger', 'shortbow'],
    })
  })
})
