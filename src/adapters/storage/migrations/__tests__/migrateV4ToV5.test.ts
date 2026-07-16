import { describe, expect, it } from 'vitest'
import { migrateV4ToV5 } from '../migrateV4ToV5'

describe('migrateV4ToV5', () => {
  it('removes persisted ability score bonuses from background selections', () => {
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
        abilityScoreBonuses: {
          strength: 2,
          constitution: 1,
        },
        choices: {
          'gaming-set': 'dice-set',
          'starting-equipment': 'equipment-package',
        },
      },
    }

    expect(
      migrateV4ToV5({
        schemaVersion: 4,
        character,
      }),
    ).toEqual({
      schemaVersion: 5,
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
            'starting-equipment': 'equipment-package',
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
      migrateV4ToV5({
        schemaVersion: 4,
        character,
      }),
    ).toEqual({
      schemaVersion: 5,
      character,
    })
  })
})
