import { describe, expect, it } from 'vitest'
import {
  createRangerWeaponMasteryChoices,
  RANGER_WEAPON_MASTERY_SLOT_THRESHOLDS,
} from '../ranger.weaponMastery'
import { getWeaponMasterySlotCount } from '../../../../../domain/class/weaponMastery'

describe('ranger weapon mastery', () => {
  it('grants two mastery slots at level 1 only', () => {
    expect(
      getWeaponMasterySlotCount(1, RANGER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
    expect(
      getWeaponMasterySlotCount(20, RANGER_WEAPON_MASTERY_SLOT_THRESHOLDS),
    ).toBe(2)
  })

  it('builds deterministic fixture selections', () => {
    expect(createRangerWeaponMasteryChoices(1)).toEqual({
      'weapon-mastery': ['longbow', 'shortsword'],
    })
  })
})
