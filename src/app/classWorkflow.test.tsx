// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import {
  completeFighterSelection,
  goToClassStep,
  goToSpeciesStep,
  waitForClassLoaded,
} from '../test/wizardTestUtils'

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

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'char-1',
    name: 'Aldric',
    editionId: 'srd-2024',
    creationMethod: 'manual',
    abilityScores: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    class: {
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {
        'fighting-style': 'defense',
        'skill-proficiencies': ['athletics', 'perception'],
      },
    },
    background: null,
    ...overrides,
  }
}

async function renderLoadedApp(character = createStoredCharacter()) {
  loadMock.mockResolvedValue(character)
  const user = userEvent.setup()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })

  return { user, character }
}

function getEditionSelect() {
  return screen.getByRole('combobox', { name: /rules edition/i })
}

function expectSelectedClass(name: string) {
  const selection = document.querySelector('.class-picker__selection')

  expect(selection).not.toBeNull()
  expect(selection).toHaveTextContent(new RegExp(`Selected:\\s*${name}`, 'i'))
}

describe('Class workflow in App', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('reflects a saved fighter selection on load', async () => {
    const { user } = await renderLoadedApp()
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)

    expectSelectedClass('Fighter')
    expect(
      screen.getByRole('button', { name: 'Fighter', pressed: true }),
    ).toBeInTheDocument()
    expect(screen.getByText('Selected: Defense')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Fighting Style/i }))
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Athletics' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Perception' })).toBeChecked()
  })

  it('keeps an incomplete fighter draft-only and blocks saving', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      class: null,
    })
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      document.querySelector('.class-picker__selection'),
    ).toHaveTextContent(/Selecting:.*complete required choices to confirm/i)
    expect(screen.getByRole('button', { name: /save draft/i })).toBeDisabled()
    expect(saveMock).not.toHaveBeenCalled()
  })

  it('saves the stable class selection after completing fighter choices', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      class: null,
    })

    await completeFighterSelection(user, screen, {
      fightingStyle: /Great Weapon Fighting/i,
      skills: ['History', 'Insight'],
    })

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        class: {
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {
            'fighting-style': 'great-weapon-fighting',
            'skill-proficiencies': ['history', 'insight'],
          },
        },
      }),
    )
  })

  it('prompts before clearing species and class when both are incompatible', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')

    expect(
      screen.getByRole('alertdialog', { name: /change rules edition/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/clear your species and class selections/i),
    ).toBeInTheDocument()
    expect(getEditionSelect()).toHaveValue('srd-2024')
  })

  it('keeps edition, species, and class when the prompt is cancelled', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(getEditionSelect()).toHaveValue('srd-2024')
    await goToSpeciesStep(user, screen)
    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      /Selected:\s*Dwarf/i,
    )
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)
    expectSelectedClass('Fighter')
  })

  it('changes edition and clears incompatible species and class on continue', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(getEditionSelect()).toHaveValue('srd-2014')
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)
    expect(document.querySelector('.class-picker__selection')).toBeNull()
    expect(
      screen.getByText(/no bundled classes are available for this rules edition/i),
    ).toBeInTheDocument()
  })
})
