import { describe, expect, it } from 'vitest'
import { createTestFighterClassInstance } from '../classFixtures'
import { createFighterWeaponMasteryChoices } from '../../content/packs/srd-2024/classes/fighter.weaponMastery'

describe('classFixtures', () => {
  it('preserves Fighter weapon mastery and Champion selections', () => {
    const level1 = createTestFighterClassInstance()
    expect(level1.classId).toBe('srd-2024:fighter')
    expect(level1.choices['weapon-mastery']).toEqual(
      createFighterWeaponMasteryChoices(1)['weapon-mastery'],
    )
    expect(level1.choices['fighter-subclass']).toBeUndefined()

    const level3 = createTestFighterClassInstance({ level: 3 })
    expect(level3.choices['fighter-subclass']).toBe('champion')
    expect(level3.choices).toMatchObject(createFighterWeaponMasteryChoices(3))
  })
})
