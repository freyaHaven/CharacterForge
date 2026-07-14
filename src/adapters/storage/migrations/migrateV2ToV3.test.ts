import { describe, expect, it } from 'vitest'
import { migrateV2ToV3 } from './migrateV2ToV3'

describe('migrateV2ToV3', () => {
  it('adds class null while preserving existing fields', () => {
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
    }

    expect(
      migrateV2ToV3({
        schemaVersion: 2,
        character,
      }),
    ).toEqual({
      schemaVersion: 3,
      character: {
        ...character,
        class: null,
      },
    })
  })

  it('preserves species and ability scores', () => {
    const character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2024' as const,
      creationMethod: 'rolled' as const,
      abilityScores: {
        strength: 18,
        dexterity: 7,
        constitution: 16,
        intelligence: 9,
        wisdom: 11,
        charisma: 14,
      },
      species: null,
    }

    const migrated = migrateV2ToV3({
      schemaVersion: 2,
      character,
    })

    expect(migrated.character.species).toBeNull()
    expect(migrated.character.abilityScores).toEqual(character.abilityScores)
    expect(migrated.character.class).toBeNull()
  })
})
