import { describe, expect, it } from 'vitest'
import { migrateV0ToV1 } from '../migrateV0ToV1'

/** Pre-species / pre-class schema shape used only for v0 migration fixtures. */
function createLegacyCharacter() {
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

describe('migrateV0ToV1', () => {
  it('wraps a legacy character without changing its fields', () => {
    const legacy = createLegacyCharacter()

    expect(migrateV0ToV1(legacy)).toEqual({
      schemaVersion: 1,
      character: legacy,
    })
  })

  it('preserves all legacy fields including creation method and ability scores', () => {
    const legacy = {
      ...createLegacyCharacter(),
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

    const migrated = migrateV0ToV1(legacy)

    expect(migrated.character).toEqual(legacy)
  })
})
