import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../domain/character/defaults'
import type { Character } from '../../domain/types'
import { CURRENT_SCHEMA_VERSION } from '../storage/storedCharacter'
import { createCharacterFileName } from './createCharacterFileName'
import { formatCharacterFileError } from './formatCharacterFileError'
import { parseCharacterFile } from './parseCharacterFile'
import { serializeCharacterFile } from './serializeCharacterFile'

function createTestCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter({
    id: 'char-export-1',
    name: 'Elara Starwind',
    editionId: 'srd-2024',
    creationMethod: 'manual',
    abilityScores: {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    },
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    ...overrides,
  })
}

describe('Character Forge file format', () => {
  it('serializes a versioned UTF-8 JSON envelope with readable formatting', () => {
    const character = createTestCharacter()
    const serialized = serializeCharacterFile(character)
    const parsed = JSON.parse(serialized)

    expect(parsed).toEqual({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      character,
    })
    expect(serialized.endsWith('\n')).toBe(true)
    expect(serialized).toContain(`\n  "schemaVersion": ${CURRENT_SCHEMA_VERSION},\n`)
  })

  it('creates a .cforge filename from the character name', () => {
    expect(createCharacterFileName(createTestCharacter())).toBe(
      'elara-starwind.cforge',
    )
    expect(createCharacterFileName(createTestCharacter({ name: '   ' }))).toBe(
      'unnamed-character.cforge',
    )
  })

  it('round-trips export and import without data loss', () => {
    const character = createTestCharacter()
    const imported = parseCharacterFile(serializeCharacterFile(character))

    expect(imported).toEqual({ ok: true, character })
  })

  it('rejects invalid JSON with a friendly reason', () => {
    expect(parseCharacterFile('{not-json')).toEqual({
      ok: false,
      reason: 'malformed',
    })
    expect(formatCharacterFileError('malformed')).toMatch(/could not be read/i)
  })

  it('rejects unsupported schema versions', () => {
    const futureVersion = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
      character: createTestCharacter(),
    })

    expect(parseCharacterFile(futureVersion)).toEqual({
      ok: false,
      reason: 'unsupported-version',
    })
    expect(formatCharacterFileError('unsupported-version')).toMatch(
      /newer version/i,
    )
  })

  it('migrates older schema versions during import', () => {
    const legacy = JSON.stringify({
      schemaVersion: 1,
      character: {
        id: 'char-legacy',
        name: 'Legacy',
        editionId: 'srd-2024',
        creationMethod: 'manual',
        abilityScores: createTestCharacter().abilityScores,
      },
    })

    const result = parseCharacterFile(legacy)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.character.species).toBeNull()
      expect(result.character.classes).toEqual([])
      expect(result.character.targetLevel).toBe(1)
    }
  })

  it('rejects files that fail character validation after migration', () => {
    const invalid = JSON.stringify({
      schemaVersion: CURRENT_SCHEMA_VERSION,
      character: {
        id: 'bad',
        name: 'Bad',
      },
    })

    expect(parseCharacterFile(invalid)).toEqual({
      ok: false,
      reason: 'invalid-character',
    })
    expect(formatCharacterFileError('invalid-character')).toMatch(
      /missing required character information/i,
    )
  })
})
