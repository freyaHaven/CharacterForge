import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { barbarianSrd2024 } from '../../../content/packs/srd-2024/classes/barbarian'
import { dwarfSrd2024 } from '../../../content/packs/srd-2024/species/dwarf'
import {
  resolveHitPointMaximum,
  rollHitDie,
} from '../resolveHitPointMaximum'
import { createSeededRandomSource } from '../../rolled/random'

describe('resolveHitPointMaximum', () => {
  it('uses max hit die at starting-class level 1 plus CON and species bonus', () => {
    const resolved = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 1,
          choices: {},
          hitPointIncreases: [{ classLevel: 1, method: 'max' }],
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
      speciesDefinition: dwarfSrd2024,
      speciesSelection: {
        speciesId: dwarfSrd2024.id,
        choices: { 'standard-languages': ['dwarvish', 'elvish'] },
      },
    })

    // d10 max (10) + CON (+2) + Dwarven Toughness (+1) = 13
    expect(resolved.maximum).toBe(13)
    expect(resolved.isComplete).toBe(true)
    expect(resolved.levels).toHaveLength(1)
    expect(resolved.levels[0]?.hitDieContribution).toBe(10)
  })

  it('adds fixed averages for later levels', () => {
    const resolved = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 3,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'fixed' },
            { classLevel: 3, method: 'fixed' },
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

    // L1: 10+2, L2: 6+2, L3: 6+2 = 28
    expect(resolved.maximum).toBe(28)
    expect(resolved.isComplete).toBe(true)
  })

  it('uses rolled values when method is roll', () => {
    const resolved = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'fighter-1',
          classId: fighterSrd2024.id,
          level: 2,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'roll', rolledValue: 4 },
          ],
        },
      ],
      startingClassInstanceId: 'fighter-1',
      classDefinitionsById: new Map([[fighterSrd2024.id, fighterSrd2024]]),
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    // L1: 10+0, L2: 4+0 = 14
    expect(resolved.maximum).toBe(14)
    expect(resolved.isComplete).toBe(true)
  })

  it('marks incomplete when a roll is missing', () => {
    const resolved = resolveHitPointMaximum({
      classes: [
        {
          instanceId: 'barbarian-1',
          classId: barbarianSrd2024.id,
          level: 2,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'roll' },
          ],
        },
      ],
      startingClassInstanceId: 'barbarian-1',
      classDefinitionsById: new Map([[barbarianSrd2024.id, barbarianSrd2024]]),
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      speciesDefinition: null,
      speciesSelection: null,
    })

    expect(resolved.isComplete).toBe(false)
    expect(resolved.levels).toHaveLength(1)
  })
})

describe('rollHitDie', () => {
  it('rolls within the die range', () => {
    const rng = createSeededRandomSource(42)
    for (let index = 0; index < 20; index += 1) {
      const value = rollHitDie(10, rng)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(10)
    }
  })
})
