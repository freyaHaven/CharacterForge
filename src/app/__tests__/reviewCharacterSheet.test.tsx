// @vitest-environment jsdom

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { withSingleClassInstance } from '../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../testing/classFixtures'
import { createDefaultCharacter } from '../../domain/character/defaults'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import type { Character } from '../../domain/types'
import {
  clearEditorSession,
  clearRecentCharacters,
  openStoredCharacterEditor,
  seedRecentCharacter,
} from '../../testing/characterEditorTestUtils'
import { COMPLETE_DWARF_SELECTION } from '../../testing/speciesSelectionTestUtils'
import { goToWizardStep } from '../../testing/wizardTestUtils'

const { loadMock, saveMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
  saveMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: saveMock,
    remove: vi.fn(),
  }),
}))

function createReviewTestCharacter(): Character {
  const fighterInstance = createTestFighterClassInstance({
    level: 3,
    choices: {
      'fighting-style': 'defense',
      'skill-proficiencies': ['athletics', 'perception'],
      'fighter-subclass': 'champion',
    },
  })

  return createDefaultCharacter({
    id: 'char-review-1',
    name: 'Freya',
    species: { ...COMPLETE_DWARF_SELECTION },
    background: {
      backgroundId: 'srd-2024:soldier',
      abilityScoreIncrease: {
        mode: 'two-and-one',
        plusTwo: 'strength',
        plusOne: 'constitution',
      },
      choices: { 'gaming-set': 'dice-set' },
    },
    feat: { featId: 'srd-2024:savage-attacker', choices: {} },
    details: {
      ...createDefaultCharacterDetails(),
      age: '52',
      pronouns: 'she-her',
      alignment: 'lawful-good',
    },
    abilityScores: {
      strength: 16,
      dexterity: 14,
      constitution: 15,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
    },
    targetLevel: 3,
    ...withSingleClassInstance(fighterInstance),
  })
}

describe('Overview character sheet content', () => {
  beforeEach(() => {
    clearEditorSession()
    clearRecentCharacters()
    loadMock.mockReset()
    saveMock.mockReset()
    saveMock.mockResolvedValue(undefined)
  })

  it('renders play-oriented Overview sections for a completed Fighter', async () => {
    const character = createReviewTestCharacter()
    seedRecentCharacter(character.id)
    loadMock.mockResolvedValue(character)

    const user = userEvent.setup()
    render(<App />)
    await openStoredCharacterEditor(user, character)
    await goToWizardStep(user, screen, 'Overview')

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Freya (She/Her)', level: 2 })).toBeInTheDocument()
    })

    expect(screen.getByText('Age 52 · Lawful Good · Dwarf')).toBeInTheDocument()
    expect(screen.getByText('Level 3')).toBeInTheDocument()

    const classSummary = screen.getByLabelText('Class summary')
    expect(within(classSummary).getByText('Fighter')).toBeInTheDocument()
    expect(within(classSummary).getByText('Champion')).toBeInTheDocument()

    const combat = screen.getByLabelText('Combat summary')
    expect(within(combat).getByText('Hit Points')).toBeInTheDocument()
    expect(within(combat).getByText('Armor Class')).toBeInTheDocument()
    expect(within(combat).getByText('Initiative')).toBeInTheDocument()
    expect(within(combat).getByText('Speed')).toBeInTheDocument()
    expect(within(combat).getByText('30 ft.')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Statistics', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Saving Throws', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Senses', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Skills', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Proficiencies & Training', level: 4 })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Character Information', level: 3 }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Features', level: 3 })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Notes', level: 3 }),
    ).not.toBeInTheDocument()

    const savesColumn = screen
      .getByRole('heading', { name: 'Saving Throws', level: 4 })
      .closest('.character-sheet__saves-column') as HTMLElement
    expect(within(savesColumn).getByRole('heading', { name: 'Senses', level: 4 })).toBeInTheDocument()
    expect(
      within(savesColumn).getByRole('heading', { name: 'Proficiencies & Training', level: 4 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Skills', level: 4 }).closest('.character-sheet__skills-column'),
    ).not.toBeNull()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Species · Dwarf', level: 4 }),
      ).toBeInTheDocument()
    })

    const speciesGroup = screen
      .getByRole('heading', { name: 'Species · Dwarf', level: 4 })
      .closest('.character-sheet__feature-group') as HTMLElement
    expect(within(speciesGroup).getByText(/Dwarven Resilience/)).toBeInTheDocument()

    const backgroundGroup = screen
      .getByRole('heading', { name: 'Background · Soldier', level: 4 })
      .closest('.character-sheet__feature-group') as HTMLElement
    expect(within(backgroundGroup).getByText('Athletics, Intimidation')).toBeInTheDocument()
    expect(
      within(backgroundGroup).queryByText('Savage Attacker'),
    ).not.toBeInTheDocument()

    const featGroup = screen
      .getByRole('heading', {
        name: 'Feats · Savage Attacker · Legacy feat',
        level: 4,
      })
      .closest('.character-sheet__feature-group') as HTMLElement
    expect(
      within(featGroup).getByText(/roll the weapon’s damage dice twice/i),
    ).toBeInTheDocument()
    expect(within(featGroup).queryByText('Origin')).not.toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Feats · Savage Attacker · Soldier',
        level: 4,
      }),
    ).toBeInTheDocument()

    const skillsPanel = screen
      .getByRole('heading', { name: 'Skills', level: 4 })
      .closest('section') as HTMLElement
    expect(within(skillsPanel).getByText('Acrobatics')).toBeInTheDocument()
    expect(within(skillsPanel).getByText('+5')).toBeInTheDocument()

    const sensesPanel = screen
      .getByRole('heading', { name: 'Senses', level: 4 })
      .closest('section') as HTMLElement
    expect(within(sensesPanel).getByText('Passive Perception')).toBeInTheDocument()
    expect(within(sensesPanel).getByText('Passive Investigation')).toBeInTheDocument()
    expect(within(sensesPanel).getByText('Passive Insight')).toBeInTheDocument()
    expect(within(sensesPanel).getByText(/Darkvision/)).toBeInTheDocument()
    expect(within(sensesPanel).getByText(/120 ft\./)).toBeInTheDocument()

    const proficiencies = screen
      .getByRole('heading', { name: 'Proficiencies & Training', level: 4 })
      .closest('section') as HTMLElement
    expect(within(proficiencies).getByText('Armor')).toBeInTheDocument()
    expect(within(proficiencies).getByText(/Light, Medium, Heavy, Shield/)).toBeInTheDocument()
    expect(within(proficiencies).getByText('Weapons')).toBeInTheDocument()
    expect(within(proficiencies).getByText(/Simple, Martial/)).toBeInTheDocument()
    expect(within(proficiencies).getByText('Tools')).toBeInTheDocument()
    expect(within(proficiencies).getByText('Dice Set')).toBeInTheDocument()
    expect(within(proficiencies).getByText('Languages')).toBeInTheDocument()
    expect(
      within(proficiencies).getByText(/Common, Dwarvish, Elvish/),
    ).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Spellcasting', level: 3 })).not.toBeInTheDocument()
  })
})
