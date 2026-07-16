// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { Character } from '../domain/types'
import { createDefaultCharacter } from '../domain/character/defaults'
import { withSingleClassInstance } from '../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../testing/classFixtures'
import {
  completeFighterSelection,
  goToClassStep,
  goToSpeciesStep,
  waitForClassLoaded,
} from '../test/wizardTestUtils'
import {
  activateEditorSession,
  clearEditorSession,
  waitForAppReady,
} from '../test/characterEditorTestUtils'
import { clearClassEditorWorkflow } from './session/classEditorWorkflowStorage'

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
  const fighterInstance = createTestFighterClassInstance()

  return createDefaultCharacter({
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
    ...withSingleClassInstance(fighterInstance),
    background: null,
    ...overrides,
  })
}

async function renderLoadedApp(character = createStoredCharacter()) {
  clearEditorSession()
  activateEditorSession(character.id)
  loadMock.mockResolvedValue(character)
  const user = userEvent.setup()
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  await waitForAppReady()

  return { user, character }
}

function getEditionSelect() {
  return screen.getByRole('combobox', { name: /rules edition/i })
}

function expectSelectedClass(name: string) {
  const overviewColumn = screen
    .getByRole('heading', { name: 'Class Overview', level: 3 })
    .closest('.class-picker__overview-column')

  expect(overviewColumn).not.toBeNull()
  expect(
    within(overviewColumn as HTMLElement).getByText(name, {
      selector: '.class-picker__overview-class-name',
    }),
  ).toBeInTheDocument()
}

describe('Class workflow in App', () => {
  beforeEach(() => {
    clearEditorSession()
    clearClassEditorWorkflow('char-1')
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
    await user.click(screen.getByRole('button', { name: /Fighting Style/i }))
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Core Fighter Traits/i }))
    expect(screen.getByRole('checkbox', { name: /^Athletics\b/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /^Perception\b/ })).toBeChecked()
  })

  it('shows compact character context in the sticky wizard header', async () => {
    const { user } = await renderLoadedApp()
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)

    const stickyHeader = document.querySelector(
      '.character-wizard__sticky-header',
    )
    expect(stickyHeader).not.toBeNull()

    await waitFor(() => {
      expect(
        within(stickyHeader as HTMLElement).getByText('Aldric · Dwarf'),
      ).toBeInTheDocument()
    })

    expect(
      within(stickyHeader as HTMLElement).getByText('Fighter 1'),
    ).toBeInTheDocument()
    expect(
      within(stickyHeader as HTMLElement).getByText(
        'Primary abilities: Strength, Dexterity',
      ),
    ).toBeInTheDocument()
  })

  it('keeps an incomplete fighter draft-only and blocks saving', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      classes: [],
      startingClassInstanceId: null,
      targetLevel: 1,
    })
    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)

    await user.click(screen.getByRole('radio', { name: /single class/i }))
    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      document.querySelector('.class-picker__summary-status'),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: /save draft/i }),
    ).not.toBeInTheDocument()

    const callsBefore = saveMock.mock.calls.length
    await new Promise((resolve) => {
      window.setTimeout(resolve, 400)
    })
    expect(saveMock.mock.calls.length).toBe(callsBefore)
  })

  it('saves the stable class selection after completing fighter choices', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      classes: [],
      startingClassInstanceId: null,
      targetLevel: 1,
    })

    await completeFighterSelection(user, screen, {
      fightingStyle: /Great Weapon Fighting/i,
      skills: ['History', 'Insight'],
    })

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          targetLevel: 1,
          classes: [
            expect.objectContaining({
              classId: 'srd-2024:fighter',
              level: 1,
              choices: {
                'fighting-style': 'great-weapon-fighting',
                'skill-proficiencies': ['history', 'insight'],
                'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
              },
            }),
          ],
          startingClassInstanceId: expect.any(String),
        }),
      )
    })
  })

  it('saves a multiclass build with derived character level and starting class', async () => {
    const { user } = await renderLoadedApp({
      ...createStoredCharacter(),
      classes: [],
      startingClassInstanceId: null,
      targetLevel: 1,
    })

    await goToClassStep(user, screen)
    await waitForClassLoaded(screen)
    await user.click(screen.getByRole('radio', { name: /multiclass/i }))
    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('button', { name: /Barbarian/i }))

    await waitFor(() => {
      expect(
        screen.getAllByText('Character level: 2').length,
      ).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('radio', { name: /^Fighter$/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /configure your classes/i }),
      ).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: /^Athletics\b/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Perception\b/ }))
    await user.click(
      screen.getByRole('checkbox', { name: /^Longsword\b/ }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: /^Shortbow\b/ }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: /^Battleaxe\b/ }),
    )

    await user.click(screen.getByRole('button', { name: /Barbarian 1/i }))

    await waitFor(() => {
      expect(
        screen.getByRole('checkbox', { name: /^Athletics\b/ }),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('checkbox', { name: /^Athletics\b/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Perception\b/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Greataxe\b/ }))
    await user.click(screen.getByRole('checkbox', { name: /^Handaxe\b/ }))

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          targetLevel: 2,
          classes: expect.arrayContaining([
            expect.objectContaining({
              classId: 'srd-2024:fighter',
              level: 1,
            }),
            expect.objectContaining({
              classId: 'srd-2024:barbarian',
              level: 1,
            }),
          ]),
          startingClassInstanceId: expect.any(String),
        }),
      )
    })
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
    expect(document.querySelector('.class-picker__summary-status')).toBeNull()
    expect(
      screen.getByText(/how will your character gain their class levels/i),
    ).toBeInTheDocument()
  })
})
