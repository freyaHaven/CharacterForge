import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import type { Character } from '../../domain/types'
import { parseStoredCharacter } from './parseStoredCharacter'
import { serializeCharacter } from './serializeCharacter'
import { CURRENT_SCHEMA_VERSION } from './storedCharacter'

const emptyClassState = {
  targetLevel: 1,
  classes: [],
  startingClassInstanceId: null,
} as const

function createTestCharacter(
  overrides: Partial<Character> = {},
): Character {
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
    ...overrides,
  })
}

function withMigratedDefaults(
  character: {
    id: string
    name: string
    editionId: Character['editionId']
    creationMethod: Character['creationMethod']
    abilityScores: Character['abilityScores']
    species?: Character['species']
    background?: Character['background']
    details?: Character['details']
    targetLevel?: number
    classes?: Character['classes']
    startingClassInstanceId?: string | null
    class?: unknown
  },
): Character {
  const {
    class: _legacyClass,
    species,
    background,
    details,
    targetLevel,
    classes,
    startingClassInstanceId,
    ...rest
  } = character

  return {
    ...rest,
    species: species ?? null,
    targetLevel: targetLevel ?? emptyClassState.targetLevel,
    classes: classes ?? [...emptyClassState.classes],
    startingClassInstanceId:
      startingClassInstanceId ?? emptyClassState.startingClassInstanceId,
    background: background ?? null,
    details: details ?? createDefaultCharacterDetails(),
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

  it('migrates an unversioned save into current class state', () => {
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
      character: withMigratedDefaults(legacy),
    })
  })

  it('migrates a schema v1 save with empty class state', () => {
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
      character: withMigratedDefaults(v1Character),
    })
  })

  it('migrates a schema v4 save by removing derived background bonuses and equipment choices', () => {
    const v4Character = {
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
      background: {
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one' as const,
          plusTwo: 'strength' as const,
          plusOne: 'constitution' as const,
        },
        abilityScoreBonuses: {
          strength: 2,
          constitution: 1,
        },
        choices: {
          'gaming-set': 'dice-set',
          'starting-equipment': 'equipment-package',
        },
      },
    }
    const raw = JSON.stringify({
      schemaVersion: 4,
      character: v4Character,
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: withMigratedDefaults({
        ...v4Character,
        background: {
          backgroundId: 'srd-2024:soldier',
          abilityScoreIncrease: {
            mode: 'two-and-one',
            plusTwo: 'strength',
            plusOne: 'constitution',
          },
          choices: {
            'gaming-set': 'dice-set',
          },
        },
      }),
    })
  })

  it('migrates a schema v5 save by removing background equipment choices', () => {
    const v5Character = {
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
      background: {
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one' as const,
          plusTwo: 'strength' as const,
          plusOne: 'constitution' as const,
        },
        choices: {
          'gaming-set': 'dice-set',
          'starting-equipment': 'gold-alternative',
        },
      },
    }
    const raw = JSON.stringify({
      schemaVersion: 5,
      character: v5Character,
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: withMigratedDefaults({
        ...v5Character,
        background: {
          backgroundId: 'srd-2024:soldier',
          abilityScoreIncrease: {
            mode: 'two-and-one',
            plusTwo: 'strength',
            plusOne: 'constitution',
          },
          choices: {
            'gaming-set': 'dice-set',
          },
        },
      }),
    })
  })

  it('migrates a schema v6 save by adding character details', () => {
    const v6Character = {
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
    }
    const raw = JSON.stringify({
      schemaVersion: 6,
      character: v6Character,
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: withMigratedDefaults(v6Character),
    })
  })

  it('migrates a schema v7 save to current character details', () => {
    const v7Character = {
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
        age: '30',
        gender: 'Female',
        pronouns: 'She/Her',
        alignment: 'true-neutral' as const,
        height: '165 cm',
        weight: '60 kg',
        eyes: 'Blue',
        hair: 'Blonde',
        skin: 'Fair',
        appearance: '',
        notes: 'Explorer',
      },
    }
    const raw = JSON.stringify({
      schemaVersion: 7,
      character: v7Character,
    })

    expect(parseStoredCharacter(raw)).toEqual({
      ok: true,
      character: withMigratedDefaults({
        id: v7Character.id,
        name: v7Character.name,
        editionId: v7Character.editionId,
        creationMethod: v7Character.creationMethod,
        abilityScores: v7Character.abilityScores,
        species: null,
        background: null,
        details: {
          age: '30',
          height: '165 cm',
          weight: '60 kg',
          gender: 'female',
          pronouns: 'she-her',
          eyeColour: 'Blue',
          hairColour: 'Blonde',
          skinTone: 'Fair',
          alignment: 'true-neutral',
          personalityTraits: '',
          ideals: '',
          bonds: '',
          flaws: '',
          backstoryNotes: 'Explorer',
        },
      }),
    })
  })

  it('migrates a schema v3 save with legacy class through the full pipeline', () => {
    const raw = JSON.stringify({
      schemaVersion: 3,
      character: {
        id: 'char-1',
        name: 'Aldric',
        editionId: 'srd-2014' as const,
        creationMethod: 'manual' as const,
        abilityScores: createTestCharacter().abilityScores,
        species: null,
        class: {
          classId: 'srd-2024:fighter',
          level: 2,
          choices: { 'fighting-style': 'defense' },
        },
      },
    })

    const result = parseStoredCharacter(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.character.targetLevel).toBe(2)
      expect(result.character.classes).toHaveLength(1)
      expect(result.character.classes[0]).toEqual(
        expect.objectContaining({
          classId: 'srd-2024:fighter',
          level: 2,
          choices: { 'fighting-style': 'defense' },
        }),
      )
      expect(result.character.startingClassInstanceId).toBe(
        result.character.classes[0].instanceId,
      )
    }
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
      schemaVersion: CURRENT_SCHEMA_VERSION,
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
      character: withMigratedDefaults(legacy),
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
      character: withMigratedDefaults(legacy),
    })
  })
})
