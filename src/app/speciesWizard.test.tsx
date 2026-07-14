// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import {
  getWizardStepButton,
  goToSpeciesStep,
  goToWizardStep,
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
    species: null,
    class: null,
    ...overrides,
  }
}

async function waitForSpeciesLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
  })
}

async function openSpeciesStep(user: ReturnType<typeof userEvent.setup>) {
  await goToSpeciesStep(user, screen)
  await waitForSpeciesLoaded()
}

function getAncestrySelect() {
  return screen.getByRole('combobox', { name: /choose your draconic ancestor/i })
}

describe('Species wizard integration', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('does not render species UI outside the wizard', async () => {
    loadMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)

    expect(screen.getAllByRole('heading', { name: 'Species' })).toHaveLength(1)
  })

  it('reports species as not started before interaction', async () => {
    loadMock.mockResolvedValue(null)
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })

    expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('shows incomplete draft status for Dragonborn without ancestry', async () => {
    loadMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /needs attention/i,
      )
    })
  })

  it('shows complete status after selecting Dwarf', async () => {
    loadMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })

  it('shows complete status for a loaded committed Dwarf selection', async () => {
    loadMock.mockResolvedValue(
      createStoredCharacter({
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    )
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dwarf' }))

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })

  it('preserves Dragonborn draft and ancestry when navigating away and back', async () => {
    loadMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))
    await user.selectOptions(getAncestrySelect(), 'red')

    await goToWizardStep(user, screen, 'Basics')
    await openSpeciesStep(user)

    expect(
      screen.getByRole('button', { name: 'Dragonborn', pressed: true }),
    ).toBeInTheDocument()
    expect(getAncestrySelect()).toHaveValue('red')
    expect(document.querySelector('.species-picker__selection')).toHaveTextContent(
      /Selected:\s*Dragonborn/i,
    )
  })

  it('preserves an incomplete Dragonborn draft when navigating away and back', async () => {
    loadMock.mockResolvedValue(null)
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })
    await openSpeciesStep(user)
    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    await goToWizardStep(user, screen, 'Basics')
    await openSpeciesStep(user)

    expect(
      screen.getByRole('button', { name: 'Dragonborn', pressed: true }),
    ).toBeInTheDocument()
    expect(getAncestrySelect()).toBeInTheDocument()
    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
  })

  it('loads saved species without marking the step as touched on a fresh render', async () => {
    loadMock.mockResolvedValue(
      createStoredCharacter({
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    )
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(getWizardStepButton(screen, 'Species')).toHaveAccessibleName(
        /complete/i,
      )
    })
  })
})
