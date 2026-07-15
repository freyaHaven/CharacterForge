import { describe, expect, it } from 'vitest'
import { migrateV8ToV9 } from './migrateV8ToV9'
import { createDefaultCharacterDetails } from '../../../domain/character/details'

const baseCharacter = {
  id: 'char-1',
  name: 'Aldric',
  editionId: 'srd-2024' as const,
  creationMethod: 'manual' as const,
  abilityScores: {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8,
  },
  species: { speciesId: 'srd-2024:dwarf', choices: {} },
  background: null,
  details: createDefaultCharacterDetails(),
}

describe('migrateV8ToV9', () => {
  it('migrates an empty class selection to v9 class state', () => {
    expect(
      migrateV8ToV9({
        schemaVersion: 8,
        character: {
          ...baseCharacter,
          class: null,
        },
      }),
    ).toEqual({
      schemaVersion: 9,
      character: {
        ...baseCharacter,
        targetLevel: 1,
        classes: [],
        startingClassInstanceId: null,
      },
    })
  })

  it('migrates a single legacy class into one instance and starting class', () => {
    expect(
      migrateV8ToV9(
        {
          schemaVersion: 8,
          character: {
            ...baseCharacter,
            class: {
              classId: 'srd-2024:fighter',
              level: 5,
              choices: {
                'fighting-style': 'defense',
                'skill-proficiencies': ['athletics', 'perception'],
              },
            },
          },
        },
        { createInstanceId: () => 'fighter-instance-1' },
      ),
    ).toEqual({
      schemaVersion: 9,
      character: {
        ...baseCharacter,
        targetLevel: 5,
        classes: [
          {
            instanceId: 'fighter-instance-1',
            classId: 'srd-2024:fighter',
            level: 5,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
        ],
        startingClassInstanceId: 'fighter-instance-1',
      },
    })
  })

  it('preserves already-multiclass character state', () => {
    expect(
      migrateV8ToV9({
        schemaVersion: 8,
        character: {
          ...baseCharacter,
          class: null,
          targetLevel: 3,
          classes: [
            {
              instanceId: 'fighter-1',
              classId: 'srd-2024:fighter',
              level: 2,
              choices: {},
            },
          ],
          startingClassInstanceId: 'fighter-1',
        },
      }),
    ).toEqual({
      schemaVersion: 9,
      character: {
        ...baseCharacter,
        targetLevel: 3,
        classes: [
          {
            instanceId: 'fighter-1',
            classId: 'srd-2024:fighter',
            level: 2,
            choices: {},
          },
        ],
        startingClassInstanceId: 'fighter-1',
      },
    })
  })
})
