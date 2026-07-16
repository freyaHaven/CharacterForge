import { describe, expect, it } from 'vitest'
import {
  collectWeaponMasterySelections,
  createWeaponMasteryChoices,
  getWeaponMasterySlotCount,
  getWeaponMasterySlotGains,
  isWeaponMasteryChoiceId,
  type WeaponMasterySlotThreshold,
} from '../weaponMastery'

const EXAMPLE_THRESHOLDS = [
  { level: 1, total: 2, choiceId: 'weapon-mastery' },
  { level: 5, total: 3, choiceId: 'weapon-mastery-weapons-3' },
] as const satisfies readonly WeaponMasterySlotThreshold[]

describe('weaponMastery', () => {
  it('detects mastery choice ids by convention', () => {
    expect(isWeaponMasteryChoiceId('weapon-mastery')).toBe(true)
    expect(isWeaponMasteryChoiceId('weapon-mastery-weapons-3')).toBe(true)
    expect(isWeaponMasteryChoiceId('weapon-mastery-weapons-6')).toBe(true)
    expect(isWeaponMasteryChoiceId('skill-proficiencies')).toBe(false)
  })

  it('computes slot counts from an explicit schedule', () => {
    expect(getWeaponMasterySlotCount(1, EXAMPLE_THRESHOLDS)).toBe(2)
    expect(getWeaponMasterySlotCount(4, EXAMPLE_THRESHOLDS)).toBe(2)
    expect(getWeaponMasterySlotCount(5, EXAMPLE_THRESHOLDS)).toBe(3)
  })

  it('collects mastery selections across any mastery choice ids', () => {
    expect(
      collectWeaponMasterySelections({
        'weapon-mastery': ['greataxe', 'handaxe'],
        'weapon-mastery-weapons-3': ['battleaxe'],
        'skill-proficiencies': ['athletics', 'perception'],
      }),
    ).toEqual(['greataxe', 'handaxe', 'battleaxe'])

    expect(
      collectWeaponMasterySelections(
        {
          'weapon-mastery': ['greataxe', 'handaxe'],
          'weapon-mastery-weapons-3': ['battleaxe'],
        },
        'weapon-mastery-weapons-3',
      ),
    ).toEqual(['greataxe', 'handaxe'])
  })

  it('builds fixture mastery choices from the given schedule and pool', () => {
    expect(
      createWeaponMasteryChoices(5, EXAMPLE_THRESHOLDS, [
        'greataxe',
        'handaxe',
        'battleaxe',
      ]),
    ).toEqual({
      'weapon-mastery': ['greataxe', 'handaxe'],
      'weapon-mastery-weapons-3': ['battleaxe'],
    })
    expect(
      getWeaponMasterySlotGains(5, EXAMPLE_THRESHOLDS).map((gain) => gain.slots),
    ).toEqual([2, 1])
  })
})
