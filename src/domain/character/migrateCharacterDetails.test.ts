import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from './details'
import { migrateLegacyCharacterDetails } from './migrateCharacterDetails'

describe('migrateLegacyCharacterDetails', () => {
  it('maps legacy colour and notes fields to the v8 shape', () => {
    expect(
      migrateLegacyCharacterDetails({
        age: '42',
        gender: 'female',
        pronouns: 'she/her',
        alignment: 'neutral-good',
        height: '170 cm',
        weight: '65 kg',
        eyes: 'Green',
        hair: 'Black',
        skin: 'Tan',
        appearance: 'Tall and lean',
        notes: 'A note',
      }),
    ).toEqual({
      age: '42',
      height: '170 cm',
      weight: '65 kg',
      gender: 'female',
      pronouns: 'she-her',
      eyeColour: 'Green',
      hairColour: 'Black',
      skinTone: 'Tan',
      alignment: 'neutral-good',
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstoryNotes: 'A note\n\nAppearance (previous): Tall and lean',
    })
  })

  it('preserves unmatched gender and pronoun values in backstoryNotes', () => {
    expect(
      migrateLegacyCharacterDetails({
        age: '',
        gender: 'Agender',
        pronouns: 'xe/xem',
        alignment: null,
        height: '',
        weight: '',
        eyes: '',
        hair: '',
        skin: '',
        appearance: '',
        notes: '',
      }),
    ).toEqual({
      ...createDefaultCharacterDetails(),
      backstoryNotes: 'Gender (previous): Agender\n\nPronouns (previous): xe/xem',
    })
  })

  it('returns already-migrated v8 details unchanged', () => {
    const migrated = {
      ...createDefaultCharacterDetails(),
      age: '27',
      gender: 'non-binary' as const,
      pronouns: 'they-them' as const,
      eyeColour: 'Blue',
      backstoryNotes: 'A traveller.',
    }

    expect(migrateLegacyCharacterDetails(migrated)).toEqual(migrated)
  })
})
