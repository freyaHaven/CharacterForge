import { describe, expect, it } from 'vitest'
import { migrateV3ToV4 } from './migrateV3ToV4'

describe('migrateV3ToV4', () => {
  it('adds background null while preserving existing fields', () => {
    const character = {
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
      class: {
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {},
      },
    }

    expect(
      migrateV3ToV4({
        schemaVersion: 3,
        character,
      }),
    ).toEqual({
      schemaVersion: 4,
      character: {
        ...character,
        background: null,
      },
    })
  })
})
