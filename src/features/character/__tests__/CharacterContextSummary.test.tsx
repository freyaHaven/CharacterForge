// @vitest-environment jsdom

import type { ComponentProps } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import type { Character } from '../../../domain/types'
import {
  createClassInstanceDraft,
  createEmptyClassSelectionDrafts,
} from '../../class/classSelectionDraft'
import { createSpeciesSelectionDraft } from '../../species/speciesSelectionDraft'
import { CharacterContextSummary } from '../CharacterContextSummary'

const speciesCatalog = createBundledSpeciesCatalog()
const classCatalog = createBundledClassCatalog()

function renderSummary(
  overrides: Omit<
    Partial<ComponentProps<typeof CharacterContextSummary>>,
    'character'
  > & {
    character?: Partial<Character>
  } = {},
) {
  const character = createDefaultCharacter({
    name: 'Elara',
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    ...overrides.character,
  })

  render(
    <CharacterContextSummary
      character={character}
      activeStepId={overrides.activeStepId ?? 'background'}
      speciesCatalog={speciesCatalog}
      classCatalog={classCatalog}
      speciesDraft={overrides.speciesDraft ?? null}
      classDrafts={overrides.classDrafts ?? createEmptyClassSelectionDrafts()}
    />,
  )
}

describe('CharacterContextSummary', () => {
  it('does not render on the basics step', () => {
    renderSummary({ activeStepId: 'basics' })

    expect(
      screen.queryByTestId('character-context-summary'),
    ).not.toBeInTheDocument()
  })

  it('does not render on the review step', () => {
    renderSummary({
      activeStepId: 'review',
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    expect(
      screen.queryByTestId('character-context-summary'),
    ).not.toBeInTheDocument()
  })

  it('does not render when no character information is available yet', () => {
    renderSummary({
      activeStepId: 'species',
      character: createDefaultCharacter({
        name: '',
        species: null,
      }),
    })

    expect(
      screen.queryByTestId('character-context-summary'),
    ).not.toBeInTheDocument()
  })

  it('shows only the character name on the species step', async () => {
    renderSummary({
      activeStepId: 'species',
      character: createDefaultCharacter({
        name: 'Freya',
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Freya')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Dwarf/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/No species selected/i)).not.toBeInTheDocument()
  })

  it('renders compact text-only markup without icons', async () => {
    renderSummary({
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    const summary = await waitFor(() =>
      screen.getByTestId('character-context-summary'),
    )
    expect(summary.tagName).toBe('ASIDE')
    expect(summary).toHaveAttribute('aria-label', 'Character context')
    expect(summary.querySelector('.character-context__icons')).toBeNull()
    expect(summary.querySelector('.character-context__lines')).not.toBeNull()
    expect(
      summary.querySelectorAll('.character-context__line').length,
    ).toBeGreaterThan(0)
  })

  it('shows name, species, and class without guidance on non-ability steps', async () => {
    renderSummary({
      character: {
        ...withSingleClassInstance(
          createTestFighterClassInstance({
            level: 3,
            choices: {
              'fighting-style': 'defense',
              'skill-proficiencies': ['athletics', 'perception'],
              'fighter-subclass': 'champion',
            },
          }),
        ),
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Elara • Dwarf')).toBeInTheDocument()
    })

    expect(screen.getByText('Fighter 3')).toBeInTheDocument()
    expect(screen.queryByText(/Champion/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Primary abilities:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Character level:/i)).not.toBeInTheDocument()
  })

  it('omits the class build line on the class step', async () => {
    renderSummary({
      activeStepId: 'class',
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Elara • Dwarf')).toBeInTheDocument()
    })

    expect(screen.queryByText('Fighter 1')).not.toBeInTheDocument()
    expect(screen.queryByText(/Prioritise:/i)).not.toBeInTheDocument()
  })

  it('shows only identity information before a class is committed', async () => {
    renderSummary({
      character: createDefaultCharacter({
        name: 'Elara',
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Elara • Dwarf')).toBeInTheDocument()
    })

    expect(screen.queryByText(/No class selected/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Prioritise:/i)).not.toBeInTheDocument()
  })

  it('previews an uncommitted class draft on non-class steps', async () => {
    renderSummary({
      classDrafts: {
        'draft-instance-1': createClassInstanceDraft(
          'draft-instance-1',
          'srd-2024:fighter',
        ),
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Fighter 1')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Prioritise:/i)).not.toBeInTheDocument()
  })

  it('shows prioritise guidance on the ability scores step', async () => {
    renderSummary({
      activeStepId: 'ability-scores',
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    await waitFor(() => {
      expect(
        screen.getByText('Prioritise: Strength • Dexterity'),
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Elara • Dwarf')).toBeInTheDocument()
    expect(screen.getByText('Fighter 1')).toBeInTheDocument()
  })

  it('prefers a species draft over the committed species selection', async () => {
    renderSummary({
      character: createDefaultCharacter({
        name: 'Elara',
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
      speciesDraft: createSpeciesSelectionDraft('srd-2024:dragonborn'),
    })

    await waitFor(() => {
      expect(screen.getByText('Elara • Dragonborn')).toBeInTheDocument()
    })
  })
})
