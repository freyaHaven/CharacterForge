import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from '../../../../domain/character/details'
import { migrateV11ToV12 } from '../migrateV11ToV12'

describe('migrateV11ToV12', () => {
  it('adds empty spellSourceStates while preserving existing fields', () => {
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
      feat: null,
      details: createDefaultCharacterDetails(),
    }

    expect(
      migrateV11ToV12({
        schemaVersion: 11,
        character,
      }),
    ).toEqual({
      schemaVersion: 12,
      character: {
        ...character,
        spellSourceStates: [],
      },
    })
  })
})
