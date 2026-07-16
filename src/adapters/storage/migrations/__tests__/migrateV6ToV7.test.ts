import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from '../../../../domain/character/details'
import { migrateV6ToV7 } from '../migrateV6ToV7'

describe('migrateV6ToV7', () => {
  it('adds default character details to stored characters', () => {
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
      species: { speciesId: 'srd-2024:dwarf', choices: {} },
      class: null,
      background: null,
    }

    expect(
      migrateV6ToV7({
        schemaVersion: 6,
        character,
      }),
    ).toEqual({
      schemaVersion: 7,
      character: {
        ...character,
        details: createDefaultCharacterDetails(),
      },
    })
  })
})
