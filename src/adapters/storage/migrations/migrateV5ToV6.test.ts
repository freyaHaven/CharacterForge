import { describe, expect, it } from 'vitest'
import { migrateV5ToV6 } from './migrateV5ToV6'

describe('migrateV5ToV6', () => {
  it('removes persisted background equipment choices from selections', () => {
    const character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2024' as const,
      creationMethod: 'manual' as const,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      species: null,
      class: null,
      background: {
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one' as const,
          plusTwo: 'strength' as const,
          plusOne: 'constitution' as const,
        },
        choices: {
          'gaming-set': 'dice-set',
          'starting-equipment': 'gold-alternative',
        },
      },
    }

    expect(
      migrateV5ToV6({
        schemaVersion: 5,
        character,
      }),
    ).toEqual({
      schemaVersion: 6,
      character: {
        ...character,
        background: {
          backgroundId: 'srd-2024:soldier',
          abilityScoreIncrease: {
            mode: 'two-and-one',
            plusTwo: 'strength',
            plusOne: 'constitution',
          },
          choices: {
            'gaming-set': 'dice-set',
          },
        },
      },
    })
  })

  it('preserves null background selections', () => {
    const character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2024' as const,
      creationMethod: 'manual' as const,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
      species: null,
      class: null,
      background: null,
    }

    expect(
      migrateV5ToV6({
        schemaVersion: 5,
        character,
      }),
    ).toEqual({
      schemaVersion: 6,
      character,
    })
  })
})
