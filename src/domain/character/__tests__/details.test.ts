import { describe, expect, it } from 'vitest'
import {
  createDefaultCharacterDetails,
  hasCharacterDetailsContent,
  isCharacterDetails,
} from '../details'

describe('CharacterDetails', () => {
  it('creates empty defaults', () => {
    expect(createDefaultCharacterDetails()).toEqual({
      age: '',
      height: '',
      weight: '',
      gender: null,
      pronouns: null,
      eyeColour: '',
      hairColour: '',
      skinTone: '',
      alignment: null,
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstoryNotes: '',
    })
  })

  it('validates a complete details object', () => {
    expect(
      isCharacterDetails({
        age: '42',
        height: '170 cm',
        weight: '65 kg',
        gender: 'female',
        pronouns: 'she-her',
        eyeColour: 'Green',
        hairColour: 'Black',
        skinTone: 'Tan',
        alignment: 'neutral-good',
        personalityTraits: 'Curious',
        ideals: 'Justice',
        bonds: 'My sister',
        flaws: 'Stubborn',
        backstoryNotes: 'A note',
      }),
    ).toBe(true)
  })

  it('rejects invalid gender, pronoun, and alignment values', () => {
    expect(
      isCharacterDetails({
        ...createDefaultCharacterDetails(),
        gender: 'custom',
      }),
    ).toBe(false)
    expect(
      isCharacterDetails({
        ...createDefaultCharacterDetails(),
        pronouns: 'xe-xem',
      }),
    ).toBe(false)
    expect(
      isCharacterDetails({
        ...createDefaultCharacterDetails(),
        alignment: 'chaotic-awesome',
      }),
    ).toBe(false)
  })

  it('detects populated content across fields', () => {
    expect(hasCharacterDetailsContent(createDefaultCharacterDetails())).toBe(
      false,
    )
    expect(
      hasCharacterDetailsContent({
        ...createDefaultCharacterDetails(),
        gender: 'female',
      }),
    ).toBe(true)
    expect(
      hasCharacterDetailsContent({
        ...createDefaultCharacterDetails(),
        backstoryNotes: '  ',
      }),
    ).toBe(false)
  })
})
