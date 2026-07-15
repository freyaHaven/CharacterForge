// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { createDefaultCharacter } from '../domain/character/defaults'
import { createDefaultCharacterDetails } from '../domain/character/details'
import type { Character } from '../domain/types'
import { BACKSTORY_NOTES_PLACEHOLDER } from '../features/character-details/characterDetailsConstants'
import {
  CHARACTER_DETAILS_AGE_GUIDANCE_ID,
  CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID,
} from '../features/character-details/characterDetailsA11y'
import {
  getWizardStepButton,
  goToAbilityScoresStep,
  goToSpeciesStep,
  goToWizardStep,
} from '../test/wizardTestUtils'
import { getAbilityFieldNumberInput } from '../test/abilityScoreTestUtils'
import {
  activateEditorSession,
  clearEditorSession,
  waitForAppReady,
} from '../test/characterEditorTestUtils'
import {
  createTestFighterClassInstance,
  withSingleClassInstance,
} from '../domain/character/characterClassSelection'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../adapters/localStorageCharacterRepository', () => ({
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

async function goToCharacterDetailsStep(
  user: ReturnType<typeof userEvent.setup>,
) {
  await goToWizardStep(user, screen, 'Character Details')
}

describe('Character Details workflow', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('renders the roleplay-focused layout and backstory placeholder', async () => {
    const { user } = await renderLoadedApp()
    await goToCharacterDetailsStep(user)

    expect(
      screen.getByRole('heading', { name: 'Character Details', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personality', level: 3 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Age' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Female' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'They/Them' })).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(BACKSTORY_NOTES_PLACEHOLDER),
    ).toBeInTheDocument()
  })

  it('shows species guidance beneath age and height without overwriting values', async () => {
    const { user } = await renderLoadedApp()
    await goToCharacterDetailsStep(user)

    await waitFor(() => {
      expect(
        screen.getByText(/dwarves mature at the same rate as humans/i),
      ).toBeInTheDocument()
    })

    const ageField = screen.getByRole('textbox', { name: 'Age' })
    expect(ageField).toHaveAttribute(
      'aria-describedby',
      CHARACTER_DETAILS_AGE_GUIDANCE_ID,
    )
    await user.type(ageField, '35')

    await goToSpeciesStep(user, screen)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))
    await user.selectOptions(
      screen.getByRole('combobox', { name: /choose your draconic ancestor/i }),
      'red',
    )

    await goToCharacterDetailsStep(user)

    await waitFor(() => {
      expect(
        screen.getByText(/dragonborn reach adulthood by age 15/i),
      ).toBeInTheDocument()
    })

    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('35')
    expect(screen.getByRole('textbox', { name: 'Height' })).toHaveAttribute(
      'aria-describedby',
      CHARACTER_DETAILS_HEIGHT_GUIDANCE_ID,
    )
  })

  it('persists edited details when saving a draft', async () => {
    const { user } = await renderLoadedApp()

    await goToCharacterDetailsStep(user)
    await user.type(screen.getByRole('textbox', { name: 'Age' }), '42')
    await user.type(screen.getByRole('textbox', { name: 'Eye Colour' }), 'Green')
    await user.type(screen.getByRole('textbox', { name: 'Personality Traits' }), 'Bold')
    await user.click(screen.getByRole('radio', { name: 'Female' }))
    await user.click(screen.getByRole('radio', { name: /Neutral Good/i }))
    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            age: '42',
            eyeColour: 'Green',
            personalityTraits: 'Bold',
            gender: 'female',
            alignment: 'neutral-good',
          }),
        }),
      )
    })
  })

  it('shows sectioned review content only for populated fields', async () => {
    const { user } = await renderLoadedApp()

    await goToWizardStep(user, screen, 'Review')
    expect(
      screen.queryByRole('heading', { name: 'Character Details', level: 3 }),
    ).not.toBeInTheDocument()

    await goToCharacterDetailsStep(user)
    await user.type(screen.getByRole('textbox', { name: 'Age' }), '50')
    await user.type(screen.getByRole('textbox', { name: 'Hair Colour' }), 'Red')
    await user.type(screen.getByRole('textbox', { name: 'Flaws' }), 'Stubborn')
    await user.type(
      screen.getByPlaceholderText(BACKSTORY_NOTES_PLACEHOLDER),
      'A short note.',
    )

    await goToWizardStep(user, screen, 'Review')

    expect(
      screen.getByRole('heading', { name: 'Character Details', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personality', level: 4 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Age: 50')).toBeInTheDocument()
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

    await goToCharacterDetailsStep(user)
    expect(getWizardStepButton(screen, 'Character Details')).toBeInTheDocument()

    await goToAbilityScoresStep(user, screen)
    fireEvent.change(getAbilityFieldNumberInput(screen, 'Strength'), {
      target: { value: '11' },
    })

    await goToWizardStep(user, screen, 'Review')

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
        typeof import('../adapters/localStorageCharacterRepository')
      >('../adapters/localStorageCharacterRepository')
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
        typeof import('../adapters/localStorageCharacterRepository')
      >('../adapters/localStorageCharacterRepository')
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
