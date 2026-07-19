import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { barbarianSrd2024 } from '../../../content/packs/srd-2024/classes/barbarian'
import { dwarfSrd2024 } from '../../../content/packs/srd-2024/species/dwarf'
import { calculateCharacterHitPoints } from '../calculateCharacterHitPoints'

describe('calculateCharacterHitPoints', () => {
  it('derives single-class HP from max first level, later choices, and CON', () => {
    const resolved = calculateCharacterHitPoints({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 3,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'fixed' },
            { classLevel: 3, method: 'roll', rolledValue: 8 },
          ],
        },
      ],
      startingClassInstanceId: 'fighter-1',
      classDefinitionsById: new Map([[fighterSrd2024.id, fighterSrd2024]]),
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    // L1: 10+2, L2: 6+2, L3: 8+2 = 30
    expect(resolved.maximum).toBe(30)
    expect(resolved.isComplete).toBe(true)
  })

  it('uses each multiclass instance Hit Die and stored progression', () => {
    const resolved = calculateCharacterHitPoints({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 1,
          choices: {},
          hitPointIncreases: [{ classLevel: 1, method: 'max' }],
        },
        {
          instanceId: 'barbarian-1',
          classId: barbarianSrd2024.id,
          level: 1,
          choices: {},
          hitPointIncreases: [{ classLevel: 1, method: 'fixed' }],
        },
      ],
      startingClassInstanceId: 'fighter-1',
      classDefinitionsById: new Map([
        [fighterSrd2024.id, fighterSrd2024],
        [barbarianSrd2024.id, barbarianSrd2024],
      ]),
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 14,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    // Fighter L1 max d10: 10+2, Barbarian L1 fixed d12: 7+2 = 21
    expect(resolved.maximum).toBe(21)
    expect(resolved.levels).toHaveLength(2)
    expect(resolved.levels[0]?.hitDieContribution).toBe(10)
    expect(resolved.levels[1]?.hitDieContribution).toBe(7)
  })

  it('recalculates immediately when Constitution changes', () => {
    const classes = [
      {
        instanceId: 'fighter-1',
        classId: fighterSrd2024.id,
        level: 2,
        choices: {},
        hitPointIncreases: [
          { classLevel: 1, method: 'max' as const },
          { classLevel: 2, method: 'fixed' as const },
        ],
      },
    ]
    const definitions = new Map([[fighterSrd2024.id, fighterSrd2024]])

    const lowCon = calculateCharacterHitPoints({
      classes,
      startingClassInstanceId: 'fighter-1',
      classDefinitionsById: definitions,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 8,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })
    const highCon = calculateCharacterHitPoints({
      classes,
      startingClassInstanceId: 'fighter-1',
      classDefinitionsById: definitions,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 16,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: dwarfSrd2024,
      speciesSelection: {
        speciesId: dwarfSrd2024.id,
        choices: { 'standard-languages': ['dwarvish', 'elvish'] },
      },
    })

    // Low: (10-1)+(6-1) = 14
    expect(lowCon.maximum).toBe(14)
    // High with Dwarven Toughness: (10+3+1)+(6+3+1) = 24
    expect(highCon.maximum).toBe(24)
  })
})
