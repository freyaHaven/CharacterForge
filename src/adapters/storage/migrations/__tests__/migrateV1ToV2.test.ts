import { describe, expect, it } from 'vitest'
import { migrateV1ToV2 } from '../migrateV1ToV2'

/** Pre-species schema shape used only for v1→v2 migration fixtures. */
function createV1Character() {
  return {
    id: 'char-1',
    name: 'Aldric',
    editionId: 'srd-2014' as const,
    creationMethod: 'point-buy' as const,
    abilityScores: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
  }
}

describe('migrateV1ToV2', () => {
  it('adds species null while preserving existing fields', () => {
    const character = createV1Character()

    expect(
      migrateV1ToV2({
        schemaVersion: 1,
        character,
      }),
    ).toEqual({
      schemaVersion: 2,
      character: {
        ...character,
        species: null,
      },
    })
  })

  it('preserves ability scores and creation method', () => {
    const character = {
      ...createV1Character(),
      creationMethod: 'rolled' as const,
      abilityScores: {
        strength: 18,
        dexterity: 7,
        constitution: 16,
        intelligence: 9,
        wisdom: 11,
        charisma: 14,
      },
    }

    const migrated = migrateV1ToV2({
      schemaVersion: 1,
      character,
    })

    expect(migrated.character.abilityScores).toEqual(character.abilityScores)
    expect(migrated.character.creationMethod).toBe('rolled')
    expect(migrated.character.species).toBeNull()
  })
})
