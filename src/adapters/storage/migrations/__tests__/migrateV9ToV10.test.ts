import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from '../../../../domain/character/details'
import { migrateV9ToV10 } from '../migrateV9ToV10'

describe('migrateV9ToV10', () => {
  it('adds feat null while preserving existing fields', () => {
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
      targetLevel: 1,
      classes: [],
      startingClassInstanceId: null,
      background: null,
      details: createDefaultCharacterDetails(),
    }

    expect(
      migrateV9ToV10({
        schemaVersion: 9,
        character,
      }),
    ).toEqual({
      schemaVersion: 10,
      character: {
        ...character,
        feat: null,
      },
    })
  })
})
