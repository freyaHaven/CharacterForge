// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import type { Character } from '../../domain/types'
import {
  goToAbilityScoresStep,
  goToWizardStep,
} from '../../testing/wizardTestUtils'
import { getAbilityFieldNumberInput } from '../../testing/abilityScoreTestUtils'
import {
  activateEditorSession,
  clearEditorSession,
  waitForAppReady,
} from '../../testing/characterEditorTestUtils'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
  }),
}))

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

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter({
    id: 'char-1',
    name: 'Aldric',
    editionId: 'srd-2024',
    creationMethod: 'manual',
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    ...overrides,
  })
}

async function renderLoadedApp(character = createStoredCharacter()) {
  clearEditorSession()
  activateEditorSession(character.id)
  loadMock.mockResolvedValue(character)
  saveMock.mockResolvedValue(undefined)

  const user = userEvent.setup()
  render(<App />)

  await waitForAppReady()

  return { user, character }
}

describe('Character Details workflow', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('hides Character Details from wizard navigation for now', async () => {
    await renderLoadedApp()

    expect(
      screen.queryByRole('button', { name: /^Character Details,/i }),
    ).not.toBeInTheDocument()
  })

  it('shows sectioned review content only for populated fields', async () => {
    const { user } = await renderLoadedApp(
      createStoredCharacter({
        details: {
          ...createDefaultCharacterDetails(),
          age: '50',
          hairColour: 'Red',
          flaws: 'Stubborn',
          backstoryNotes: 'A short note.',
        },
      }),
    )

    await goToWizardStep(user, screen, 'Overview')

    expect(
      screen.getByRole('heading', { name: 'Character Details', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personality', level: 4 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Age 50/)).toBeInTheDocument()
    expect(screen.queryByText('Age: 50')).not.toBeInTheDocument()
    expect(screen.getByText('Hair Colour: Red')).toBeInTheDocument()
    expect(screen.getByText('Flaws: Stubborn')).toBeInTheDocument()
    expect(screen.getByText('A short note.')).toBeInTheDocument()
    expect(screen.queryByText(/^Gender:/)).not.toBeInTheDocument()
  })

  it('does not block wizard completion when Character Details is empty', async () => {
    const fighterInstance = createTestFighterClassInstance()
    const { user } = await renderLoadedApp(
      createStoredCharacter({
        ...withSingleClassInstance(fighterInstance),
      }),
    )

    expect(
      screen.queryByRole('button', { name: /^Character Details,/i }),
    ).not.toBeInTheDocument()

    await goToAbilityScoresStep(user, screen)
    fireEvent.change(getAbilityFieldNumberInput(screen, 'Strength'), {
      target: { value: '11' },
    })

    await goToWizardStep(user, screen, 'Overview')

    // Deferred class decisions may still block finish; Character Details must not.
    expect(
      screen.queryByText(
        /complete these required steps before finishing:.*character details/i,
      ),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/complete remaining character decisions before finishing/i),
    ).toBeInTheDocument()
  })
})

describe('Character Details persistence via localStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('migrates legacy schema v7 details on reload', async () => {
    const legacyCharacter = {
      id: 'char-1',
      name: 'Aldric',
      editionId: 'srd-2024' as const,
      creationMethod: 'manual' as const,
      abilityScores: createDefaultCharacter().abilityScores,
      species: { speciesId: 'srd-2024:dwarf', choices: {} },
      class: null,
      background: null,
      details: {
        age: '120',
        gender: 'custom',
        pronouns: 'xe/xem',
        alignment: null,
        height: '',
        weight: '',
        eyes: 'Brown',
        hair: '',
        skin: '',
        appearance: 'Scarred',
        notes: 'Old notes',
      },
    }

    localStorage.setItem(
      'characterforge:character:char-1',
      JSON.stringify({ schemaVersion: 7, character: legacyCharacter }),
    )

    const { createLocalStorageCharacterRepository: createRepository } =
      await vi.importActual<
        typeof import('../../adapters/localStorageCharacterRepository')
      >('../../adapters/localStorageCharacterRepository')
    const repository = createRepository()
    const loaded = await repository.load('char-1')

    expect(loaded?.details).toEqual({
      age: '120',
      height: '',
      weight: '',
      gender: null,
      pronouns: null,
      eyeColour: 'Brown',
      hairColour: '',
      skinTone: '',
      alignment: null,
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      backstoryNotes:
        'Old notes\n\nAppearance (previous): Scarred\n\nGender (previous): custom\n\nPronouns (previous): xe/xem',
    })
  })

  it('reloads saved v8 character details from storage', async () => {
    const { createLocalStorageCharacterRepository: createRepository } =
      await vi.importActual<
        typeof import('../../adapters/localStorageCharacterRepository')
      >('../../adapters/localStorageCharacterRepository')
    const repository = createRepository()
    const character = createStoredCharacter({
      details: {
        ...createDefaultCharacterDetails(),
        age: '120',
        gender: 'female',
        pronouns: 'she-her',
        backstoryNotes: 'Ancient dwarf',
      },
    })

    await repository.save(character)
    const loaded = await repository.load(character.id)

    expect(loaded?.details).toEqual(character.details)
  })
})
