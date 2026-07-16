import { describe, expect, it } from 'vitest'
import {
  formatWeaponMasteryDescription,
  formatWeaponMasteryDescriptionBody,
  getWeaponMasteryPropertyLabel,
  WEAPON_MASTERY_BY_WEAPON,
} from './mastery'
import { WEAPON_IDS } from './types'

describe('weapon mastery', () => {
  it('assigns a mastery property to every weapon', () => {
    for (const weaponId of WEAPON_IDS) {
      expect(WEAPON_MASTERY_BY_WEAPON[weaponId]).toBeTruthy()
    }
  })

  it('formats Greatsword with Graze for labels and hover text', () => {
    expect(getWeaponMasteryPropertyLabel('greatsword')).toBe('Graze')
    expect(formatWeaponMasteryDescription('greatsword')).toBe(
      'Graze. If your attack roll with a Greatsword misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the Greatsword, and the damage can be increased only by increasing the ability modifier.',
    )
    expect(formatWeaponMasteryDescriptionBody('greatsword')).toBe(
      'If your attack roll with a Greatsword misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the Greatsword, and the damage can be increased only by increasing the ability modifier.',
    )
  })
})
