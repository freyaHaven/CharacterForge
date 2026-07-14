// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'

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
    ...overrides,
  }
}

async function waitForSpeciesLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading species/i)).not.toBeInTheDocument()
  })
}

function expectSelectedSpecies(name: string) {
  const selection = document.querySelector('.species-picker__selection')

  expect(selection).not.toBeNull()
  expect(selection).toHaveTextContent(new RegExp(`Selected:\\s*${name}`, 'i'))
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
  await waitForSpeciesLoaded()

  return { user, character }
}

async function renderFreshApp() {
  loadMock.mockResolvedValue(null)
  const user = userEvent.setup()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })
  await waitForSpeciesLoaded()

  return { user }
}

function getEditionSelect() {
  return screen.getByRole('combobox', { name: /rules edition/i })
}

function getAncestrySelect() {
  return screen.getByRole('combobox', { name: /choose your draconic ancestor/i })
}

describe('Species workflow in App', () => {
  beforeEach(() => {
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('shows dwarf for srd-2024 and reflects a saved selection', async () => {
    await renderLoadedApp()

    expectSelectedSpecies('Dwarf')
    expect(
      screen.getByRole('button', { name: 'Dwarf', pressed: true }),
    ).toBeInTheDocument()
  })

  it('saves only the stable species selection for Dwarf', async () => {
    const { user } = await renderLoadedApp()

    await user.click(screen.getByRole('button', { name: /save character/i }))

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    )
  })

  it('keeps an incomplete Dragonborn selection draft-only and blocks saving', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      species: null,
    })

    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      await screen.findByRole('combobox', {
        name: /choose your draconic ancestor/i,
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /save character/i }),
    ).toBeDisabled()
    expect(saveMock).not.toHaveBeenCalled()
  })

  it('shows the ancestry selector after one Dragonborn click in a fresh app on srd-2024', async () => {
    const { user } = await renderFreshApp()

    expect(getEditionSelect()).toHaveValue('srd-2024')
    await waitForSpeciesLoaded()

    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      await screen.findByRole('combobox', {
        name: /choose your draconic ancestor/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Dragonborn', pressed: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/complete required choices to confirm/i),
    ).toBeInTheDocument()
  })

  it('commits Dragonborn only after a valid ancestry is chosen', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      species: null,
    })

    await user.click(screen.getByRole('button', { name: 'Dragonborn' }))

    expect(
      await screen.findByRole('combobox', {
        name: /choose your draconic ancestor/i,
      }),
    ).toBeInTheDocument()
    await user.selectOptions(getAncestrySelect(), 'red')

    expectSelectedSpecies('Dragonborn')
    expect(getAncestrySelect()).toHaveValue('red')

    await user.click(screen.getByRole('button', { name: /save character/i }))

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        species: {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'red' },
        },
      }),
    )
  })

  it('reloads a saved Red Dragonborn ancestry through the catalogue', async () => {
    await renderLoadedApp({
      ...createStoredCharacter(),
      species: {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'red' },
      },
    })

    expectSelectedSpecies('Dragonborn')
    expect(getAncestrySelect()).toHaveValue('red')
    expect(
      screen.getByText(
        /damage type of your selected ancestor applies to your breath weapon/i,
      ),
    ).toBeInTheDocument()
  })

  it('updates persisted ancestry when changing Red to Silver', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      species: {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'red' },
      },
    })

    await user.selectOptions(getAncestrySelect(), 'silver')
    await user.click(screen.getByRole('button', { name: /save character/i }))

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        species: {
          speciesId: 'srd-2024:dragonborn',
          choices: { 'draconic-ancestry': 'silver' },
        },
      }),
    )
  })

  it('prompts before clearing species when changing edition', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')

    expect(
      screen.getByRole('alertdialog', {
        name: /change rules edition/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/belongs to the previous edition/i),
    ).toBeInTheDocument()
    expect(getEditionSelect()).toHaveValue('srd-2024')
  })

  it('keeps the old edition and species when the prompt is cancelled', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(getEditionSelect()).toHaveValue('srd-2024')
    expectSelectedSpecies('Dwarf')
    expect(
      screen.queryByRole('alertdialog', { name: /change rules edition/i }),
    ).not.toBeInTheDocument()
  })

  it('changes edition and clears species when the prompt is confirmed', async () => {
    const { user } = await renderLoadedApp()

    await user.selectOptions(getEditionSelect(), 'srd-2014')
    await user.click(screen.getByRole('button', { name: /^continue$/i }))

    expect(getEditionSelect()).toHaveValue('srd-2014')
    expect(document.querySelector('.species-picker__selection')).toBeNull()
    expect(
      screen.getByText(/no bundled species are available for this rules edition/i),
    ).toBeInTheDocument()
  })

  it('reloads a saved dwarf selection through the catalogue', async () => {
    await renderLoadedApp()

    expect(await screen.findByText(/Stonecunning/i)).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText(/30 feet/i)).toBeInTheDocument()
  })
})
