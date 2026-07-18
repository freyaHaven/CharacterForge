import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalStorageCharacterRepository } from '../localStorageCharacterRepository'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import type { Character } from '../../domain/types'

const emptyClassState = {
  targetLevel: 1,
  classes: [],
  startingClassInstanceId: null,
} as const

function createTestCharacter(): Character {
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

function withMigratedDefaults(
  character: {
    id: string
    name: string
    editionId: Character['editionId']
    creationMethod: Character['creationMethod']
    abilityScores: Character['abilityScores']
    species?: Character['species']
    background?: Character['background']
    feat?: Character['feat']
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
    feat,
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
    feat: feat ?? null,
    details: details ?? createDefaultCharacterDetails(),
    spellSourceStates: [],
  }
}

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('createLocalStorageCharacterRepository', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when no character is stored', async () => {
    const repository = createLocalStorageCharacterRepository()

    await expect(repository.load('char-1')).resolves.toBeNull()
  })

  it('saves and reloads a character', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = createTestCharacter()

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded).toEqual(character)
  })

  it('removes a saved character', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = createTestCharacter()

    await repository.save(character)
    await repository.remove(character.id)

    await expect(repository.load(character.id)).resolves.toBeNull()
  })

  it('persists characters in a versioned envelope', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = createTestCharacter()

    await repository.save(character)

    expect(JSON.parse(localStorage.getItem('characterforge:character:char-1')!)).toEqual({
      schemaVersion: 12,
      character,
    })
  })

  it('migrates a schema v1 save on load', async () => {
    const v1Character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2014' as const,
      creationMethod: 'manual' as const,
      abilityScores: createTestCharacter().abilityScores,
    }
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({ schemaVersion: 1, character: v1Character }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toEqual(withMigratedDefaults(v1Character))
  })

  it('migrates a legacy unversioned save on load', async () => {
    const character = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2014' as const,
      creationMethod: 'manual' as const,
      abilityScores: createTestCharacter().abilityScores,
    }
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify(character),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toEqual(withMigratedDefaults(character))
  })

  it('saves and reloads a selected species', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = {
      ...createTestCharacter(),
      editionId: 'srd-2024' as const,
      species: { speciesId: 'srd-2024:dwarf', choices: {} },
    }

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded).toEqual(character)
  })

  it('saves and reloads a Dragonborn ancestry id', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = {
      ...createTestCharacter(),
      editionId: 'srd-2024' as const,
      species: {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'red' },
      },
    }

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded?.species).toEqual({
      speciesId: 'srd-2024:dragonborn',
      choices: { 'draconic-ancestry': 'red' },
    })
  })

  it('preserves ability scores when loading a legacy save', async () => {
    const character = {
      ...createTestCharacter(),
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
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify(character),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded?.abilityScores).toEqual(character.abilityScores)
  })

  it('preserves creation method when loading a legacy save', async () => {
    const character = {
      ...createTestCharacter(),
      creationMethod: 'standard-array' as const,
    }
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify(character),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded?.creationMethod).toBe('standard-array')
  })

  it('migrates a schema v3 save with legacy class on load', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({
        schemaVersion: 3,
        character: {
          id: 'char-1',
          name: 'Aldric',
          editionId: 'srd-2024',
          creationMethod: 'manual',
          abilityScores: createTestCharacter().abilityScores,
          species: null,
          class: {
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
            },
          },
        },
      }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded?.targetLevel).toBe(1)
    expect(loaded?.classes).toHaveLength(1)
    expect(loaded?.classes[0]).toEqual(
      expect.objectContaining({
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
        },
      }),
    )
    expect(loaded?.startingClassInstanceId).toBe(loaded?.classes[0].instanceId)
  })

  it('returns null for an unsupported future schema version', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({
        schemaVersion: 99,
        character: createTestCharacter(),
      }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })

  it('preserves edition id after save and reload', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = { ...createTestCharacter(), editionId: 'srd-2024' as const }

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded?.editionId).toBe('srd-2024')
  })

  it('preserves creation method after save and reload', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = {
      ...createTestCharacter(),
      creationMethod: 'point-buy' as const,
    }

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded?.creationMethod).toBe('point-buy')
  })

  it('overwrites an existing character with the same id', async () => {
    const repository = createLocalStorageCharacterRepository()
    const character = createTestCharacter()

    await repository.save(character)
    await repository.save({ ...character, name: 'Brenna' })

    const loaded = await repository.load(character.id)

    expect(loaded?.name).toBe('Brenna')
  })

  it('returns null when stored JSON is malformed', async () => {
    localStorage.setItem('characterforge:character:char-1', '{ not valid json')

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })

  it('returns null when stored data is missing required fields', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({ id: 'char-1', name: 'Aldric' }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })

  it('returns null when stored data has an invalid edition id', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({ ...createTestCharacter(), editionId: 'srd-2020' }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })

  it('returns null when an ability score is stored as a string', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({
        ...createTestCharacter(),
        abilityScores: {
          ...createTestCharacter().abilityScores,
          strength: '15',
        },
      }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })

  it('returns null when abilityScores is null', async () => {
    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({ ...createTestCharacter(), abilityScores: null }),
    )

    const repository = createLocalStorageCharacterRepository()
    const loaded = await repository.load('char-1')

    expect(loaded).toBeNull()
  })
})
