import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { createFighterWeaponMasteryChoices } from '../../../content/packs/srd-2024/classes/fighter.weaponMastery'
import type { ClassDefinition } from '../../../domain/class/types'
import { validateCharacterClassesWithDefinitions } from '../validateCharacterClasses'

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
      description: 'Resolve the level 4 Ability Score Improvement or feat',
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

describe('validateCharacterClassesWithDefinitions', () => {
  it('accepts Fighter 3 + Rogue 2 against target level 5 structurally', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
              ...createFighterWeaponMasteryChoices(3),
              'fighter-subclass': 'champion',
            },
          },
          {
            instanceId: 'rogue-1',
            classId: 'srd-2024:rogue',
            level: 2,
            choices: {},
          },
        ],
        targetLevel: 5,
        editionId: 'srd-2024',
        startingClassInstanceId: 'fighter-1',
      },
      getDefinition,
    )

    expect(result.status).toBe('complete')
    expect(result.structurallyValid).toBe(true)
    expect(result.allocationComplete).toBe(true)
    expect(result.allocatedLevel).toBe(5)
    expect(result.remainingLevels).toBe(0)
  })

  it('treats allocated 4 against target 5 as incomplete but draft-valid', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 4,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
        ],
        targetLevel: 5,
        editionId: 'srd-2024',
        startingClassInstanceId: 'fighter-1',
      },
      getDefinition,
    )

    expect(result.status).toBe('incomplete')
    expect(result.structurallyValid).toBe(true)
    expect(result.allocationComplete).toBe(false)
    expect(result.remainingLevels).toBe(1)
  })

  it('rejects allocated 6 against target 5 as structurally invalid', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 6,
            choices: {},
          },
        ],
        targetLevel: 5,
        editionId: 'srd-2024',
        startingClassInstanceId: 'fighter-1',
      },
      getDefinition,
    )

    expect(result.status).toBe('structurally-invalid')
    expect(result.issues.some((issue) => issue.code === 'allocation-exceeds-target')).toBe(
      true,
    )
  })

  it('rejects duplicate class ids', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          {
            instanceId: 'fighter-2',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
        ],
        targetLevel: 2,
        editionId: 'srd-2024',
      },
      getDefinition,
    )

    expect(result.status).toBe('structurally-invalid')
    expect(result.issues.some((issue) => issue.code === 'duplicate-class-id')).toBe(
      true,
    )
  })

  it('rejects duplicate instance ids', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'shared-id',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          {
            instanceId: 'shared-id',
            classId: 'srd-2024:rogue',
            level: 1,
            choices: {},
          },
        ],
        targetLevel: 2,
        editionId: 'srd-2024',
      },
      getDefinition,
    )

    expect(result.status).toBe('structurally-invalid')
    expect(
      result.issues.some((issue) => issue.code === 'duplicate-instance-id'),
    ).toBe(true)
  })

  it('reports validation errors with instance ownership metadata', () => {
    const result = validateCharacterClassesWithDefinitions(
      {
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          {
            instanceId: 'rogue-1',
            classId: 'srd-2024:rogue',
            level: 1,
            choices: {},
          },
        ],
        targetLevel: 2,
        editionId: 'srd-2024',
      },
      getDefinition,
    )

    expect(result.status).toBe('incomplete')
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceInstanceId: 'fighter-1',
          sourceClassId: 'srd-2024:fighter',
          choiceId: 'fighting-style',
        }),
      ]),
    )
  })
})
