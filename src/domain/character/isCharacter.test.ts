import { describe, expect, it } from 'vitest'
import { isCharacter } from './isCharacter'
import type { Character } from '../types'

function createValidCharacter(): Character {
  return {
    id: 'char-1',
    name: 'Aldric',
    editionId: 'srd-2014',
    creationMethod: 'manual',
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

describe('isCharacter', () => {
  it('returns true for a complete valid character', () => {
    expect(isCharacter(createValidCharacter())).toBe(true)
  })

  it('returns false when required fields are missing', () => {
    const { abilityScores: _abilityScores, ...withoutAbilityScores } =
      createValidCharacter()

    expect(isCharacter(withoutAbilityScores)).toBe(false)
    expect(isCharacter({ ...createValidCharacter(), id: undefined })).toBe(
      false,
    )
  })

  it('returns false for an invalid edition id', () => {
    expect(
      isCharacter({ ...createValidCharacter(), editionId: 'srd-2020' }),
    ).toBe(false)
  })

  it('returns false for an invalid creation method', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        creationMethod: 'random-roll',
      }),
    ).toBe(false)
  })

  it('returns false when an ability score is stored as a string', () => {
    const character = createValidCharacter()

    expect(
      isCharacter({
        ...character,
        abilityScores: {
          ...character.abilityScores,
          strength: '15',
        },
      }),
    ).toBe(false)
  })

  it('returns false when abilityScores is null', () => {
    expect(
      isCharacter({ ...createValidCharacter(), abilityScores: null }),
    ).toBe(false)
  })
})
