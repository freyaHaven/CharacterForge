import { describe, expect, it } from 'vitest'
import { migrateV7ToV8 } from '../migrateV7ToV8'

describe('migrateV7ToV8', () => {
  it('migrates legacy v7 character details to the v8 shape', () => {
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
      details: {
        age: '120',
        gender: 'Male',
        pronouns: 'He/Him',
        alignment: 'lawful-good' as const,
        height: '140 cm',
        weight: '80 kg',
        eyes: 'Brown',
        hair: 'Red',
        skin: 'Pale',
        appearance: 'Scarred hands',
        notes: 'Old soldier',
      },
    }

    expect(
      migrateV7ToV8({
        schemaVersion: 7,
        character,
      }),
    ).toEqual({
      schemaVersion: 8,
      character: {
        ...character,
        details: {
          age: '120',
          height: '140 cm',
          weight: '80 kg',
          gender: 'male',
          pronouns: 'he-him',
          eyeColour: 'Brown',
          hairColour: 'Red',
          skinTone: 'Pale',
          alignment: 'lawful-good',
          personalityTraits: '',
          ideals: '',
          bonds: '',
          flaws: '',
          backstoryNotes: 'Old soldier\n\nAppearance (previous): Scarred hands',
        },
      },
    })
  })
})
