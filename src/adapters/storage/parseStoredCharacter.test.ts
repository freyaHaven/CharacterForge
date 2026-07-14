import { describe, expect, it } from 'vitest'
import type { Character } from '../../domain/types'
import { parseStoredCharacter } from './parseStoredCharacter'
import { serializeCharacter } from './serializeCharacter'

function createTestCharacter(
  overrides: Partial<Character> = {},
): Character {
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
    species: null,
    ...overrides,
  }
}

describe('parseStoredCharacter', () => {
  it('loads a current versioned save', () => {
    const character = createTestCharacter({
      creationMethod: 'standard-array',
      species: { speciesId: 'srd-2024:dwarf', choices: {} },
    })
    const raw = serializeCharacter(character)

    expect(parseStoredCharacter(raw)).toEqual({ ok: true, character })
  })

  it('migrates an unversioned save and adds species null', () => {
    const legacy = {
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
    const raw = JSON.stringify(legacy)

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: { ...legacy, species: null },
    })
  })

  it('migrates a schema v1 save to v2 with species null', () => {
    const v1Character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2014' as const,
      creationMethod: 'manual' as const,
      abilityScores: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
    }
    const raw = JSON.stringify({
      schemaVersion: 1,
      character: v1Character,
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: { ...v1Character, species: null },
    })
  })

  it('rejects an unsupported future schema version', () => {
    const raw = JSON.stringify({
      schemaVersion: 99,
      character: createTestCharacter(),
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: false,
      reason: 'unsupported-version',
    })
  })

  it('rejects malformed JSON', () => {
    expect(parseStoredCharacter('{ not valid json')).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })

  it('rejects unrecognised root shapes', () => {
    expect(parseStoredCharacter(JSON.stringify({ name: 'Aldric' }))).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })

  it('rejects versioned saves with invalid character data', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      character: { ...createTestCharacter(), editionId: 'srd-2020' },
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: false,
      reason: 'invalid-character',
    })
  })

  it('preserves ability scores when migrating an unversioned save', () => {
    const legacy = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2014' as const,
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

    const result = parseStoredCharacter(JSON.stringify(legacy))

    expect(result).toEqual({
      ok: true,
      character: { ...legacy, species: null },
    })
  })

  it('preserves creation method when migrating an unversioned save', () => {
    const legacy = {
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

    const result = parseStoredCharacter(JSON.stringify(legacy))

    expect(result).toEqual({
      ok: true,
      character: { ...legacy, species: null },
    })
  })
})
