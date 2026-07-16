import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from './defaults'
import { isCharacter } from './isCharacter'
import type { Character } from '../types'
import { withSingleClassInstance } from './characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'

function createValidCharacter(): Character {
  return createDefaultCharacter({
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
  })
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

  it('returns true when species is null', () => {
    expect(isCharacter({ ...createValidCharacter(), species: null })).toBe(true)
  })

  it('returns true when feat is null', () => {
    expect(isCharacter({ ...createValidCharacter(), feat: null })).toBe(true)
  })

  it('returns true for a valid feat selection', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        feat: { featId: 'srd-2024:alert', choices: {} },
      }),
    ).toBe(true)
  })

  it('returns false when feat is missing', () => {
    const { feat: _feat, ...withoutFeat } = createValidCharacter()

    expect(isCharacter(withoutFeat)).toBe(false)
  })

  it('returns true for a valid species selection', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    ).toBe(true)
  })

  it('returns false when species is missing', () => {
    const { species: _species, ...withoutSpecies } = createValidCharacter()

    expect(isCharacter(withoutSpecies)).toBe(false)
  })

  it('returns false for an invalid species selection', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        species: { speciesId: '', choices: {} },
      }),
    ).toBe(false)
  })

  it('returns false when class fields are missing', () => {
    const { classes: _classes, ...withoutClasses } = createValidCharacter()

    expect(isCharacter(withoutClasses)).toBe(false)
  })

  it('returns true for an empty class state', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        targetLevel: 1,
        classes: [],
        startingClassInstanceId: null,
      }),
    ).toBe(true)
  })

  it('returns true for a valid class instance', () => {
    const instance = createTestFighterClassInstance()

    expect(
      isCharacter({
        ...createValidCharacter(),
        ...withSingleClassInstance(instance),
      }),
    ).toBe(true)
  })

  it('returns false when startingClassInstanceId does not match a class', () => {
    const instance = createTestFighterClassInstance()

    expect(
      isCharacter({
        ...createValidCharacter(),
        ...withSingleClassInstance(instance),
        startingClassInstanceId: 'missing-instance',
      }),
    ).toBe(false)
  })

  it('returns false when allocated level exceeds target level', () => {
    const instance = createTestFighterClassInstance({ level: 5 })

    expect(
      isCharacter({
        ...createValidCharacter(),
        targetLevel: 3,
        classes: [instance],
        startingClassInstanceId: instance.instanceId,
      }),
    ).toBe(false)
  })

  it('rejects duplicate class ids', () => {
    expect(
      isCharacter({
        ...createValidCharacter(),
        targetLevel: 2,
        classes: [
          {
            instanceId: 'a',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
          {
            instanceId: 'b',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
        ],
        startingClassInstanceId: 'a',
      }),
    ).toBe(false)
  })
})
