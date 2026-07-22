import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import type { ClassDefinition } from '../../../domain/class/types'
import { createDeferredRequirementKey } from '../../../features/class/classChoiceStateKeys'
import { resolveDeferredRequirementsForInstances } from '../resolveCharacterDeferredRequirements'

const rogueFixture: ClassDefinition = {
  id: 'srd-2024:rogue',
  editionId: 'srd-2024',
  name: 'Rogue',
  description: 'Test rogue fixture',
  source: fighterSrd2024.source,
  hitDie: { sides: 8 },
  primaryAbilities: ['dexterity'],
  multiclassPrerequisite: {
    kind: 'all-of',
    abilities: ['dexterity'],
    minimum: 13,
    summary: 'Dexterity 13',
  },
  savingThrows: ['dexterity', 'intelligence'],
  proficiencies: {
    armor: ['light'],
    weapons: ['simple'],
    tools: [],
    skillOptions: ['stealth'],
  },
  featureProgression: [],
  choices: [],
  deferredRequirements: [
    {
      id: 'ability-score-improvement-4',
      level: 4,
      destinationStep: 'ability-scores',
      label: 'Ability Score Improvement',
      description: 'Resolve the rogue level 4 Ability Score Improvement or feat',
    },
  ],
  startingEquipment: fighterSrd2024.startingEquipment,
}

function getDefinition(classId: string): ClassDefinition | null {
  if (classId === 'srd-2024:fighter') {
    return fighterSrd2024
  }

  if (classId === 'srd-2024:rogue') {
    return rogueFixture
  }

  return null
}

describe('resolveDeferredRequirementsForInstances', () => {
  it('includes ownership metadata for each requirement', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const startingEquipment = resolved.find(
      (entry) => entry.requirementId === 'starting-equipment',
    )

    expect(startingEquipment).toEqual(
      expect.objectContaining({
        requirementId: 'starting-equipment',
        sourceInstanceId: 'fighter-1',
        sourceClassId: 'srd-2024:fighter',
        sourceClassLevel: 4,
        destinationStep: 'equipment',
      }),
    )
    expect(
      resolved.some(
        (entry) => entry.requirementId === 'ability-score-improvement-4',
      ),
    ).toBe(false)
  })

  it('keeps duplicate raw requirement ids distinct across instances', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'rogue-1',
          classId: 'srd-2024:rogue',
          level: 4,
          choices: {},
        },
        {
          instanceId: 'rogue-2',
          classId: 'srd-2024:rogue',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const firstAsi = resolved.find(
      (entry) =>
        entry.sourceInstanceId === 'rogue-1' &&
        entry.requirementId === 'ability-score-improvement-4',
    )
    const secondAsi = resolved.find(
      (entry) =>
        entry.sourceInstanceId === 'rogue-2' &&
        entry.requirementId === 'ability-score-improvement-4',
    )

    expect(firstAsi).toBeDefined()
    expect(secondAsi).toBeDefined()
    expect(
      createDeferredRequirementKey(
        firstAsi!.sourceInstanceId,
        firstAsi!.requirementId,
      ),
    ).not.toBe(
      createDeferredRequirementKey(
        secondAsi!.sourceInstanceId,
        secondAsi!.requirementId,
      ),
    )
  })

  it('does not defer fighter weapon mastery or ASI after they move to the class step', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 16,
          choices: {},
        },
      ],
      getDefinition,
    )

    expect(
      resolved.filter((requirement) => requirement.label === 'Weapon Mastery'),
    ).toEqual([])
    expect(
      resolved.filter(
        (requirement) => requirement.label === 'Ability Score Improvement',
      ),
    ).toEqual([])
    expect(resolved.map((entry) => entry.requirementId)).toEqual([
      'starting-equipment',
    ])
  })

  it('orders requirements by class array order, level, and definition order', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'rogue-1',
          classId: 'srd-2024:rogue',
          level: 4,
          choices: {},
        },
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 4,
          choices: {},
        },
      ],
      getDefinition,
    )

    const firstRogueIndex = resolved.findIndex(
      (entry) => entry.sourceInstanceId === 'rogue-1',
    )
    const firstFighterIndex = resolved.findIndex(
      (entry) => entry.sourceInstanceId === 'fighter-1',
    )

    expect(firstRogueIndex).toBeGreaterThanOrEqual(0)
    expect(firstFighterIndex).toBeGreaterThan(firstRogueIndex)
  })

  it('matches single-fighter deferred output aside from ownership metadata', () => {
    const resolved = resolveDeferredRequirementsForInstances(
      [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ],
      getDefinition,
    )

    expect(resolved.map((entry) => entry.description)).toEqual([
      'Choose starting equipment in Equipment',
    ])
  })
})
