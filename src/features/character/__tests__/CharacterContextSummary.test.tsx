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
import { createClassInstanceDraft, createEmptyClassSelectionDrafts } from '../../class/classSelectionDraft'
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
      activeStepId={overrides.activeStepId ?? 'class'}
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

    expect(screen.queryByTestId('character-context-summary')).not.toBeInTheDocument()
  })

  it('does not render on the review step', () => {
    renderSummary({
      activeStepId: 'review',
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    expect(screen.queryByTestId('character-context-summary')).not.toBeInTheDocument()
  })

  it('does not render when no character information is available yet', () => {
    renderSummary({
      activeStepId: 'species',
      character: createDefaultCharacter({
        name: '',
        species: null,
      }),
    })

    expect(screen.queryByTestId('character-context-summary')).not.toBeInTheDocument()
  })

  it('shows only the character name on the species step before a species is selected', async () => {
    renderSummary({
      activeStepId: 'species',
      character: createDefaultCharacter({
        name: 'Freya',
        species: null,
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Freya')).toBeInTheDocument()
    })

    expect(screen.queryByText(/No species selected/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Unnamed character/i)).not.toBeInTheDocument()
  })

  it('renders responsive-safe markup for the sticky context panel', () => {
    renderSummary({
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    const summary = screen.getByTestId('character-context-summary')
    expect(summary.tagName).toBe('ASIDE')
    expect(summary).toHaveAttribute('aria-label', 'Character context')
    expect(summary.querySelector('.character-context__lines')).not.toBeNull()
    expect(summary.querySelectorAll('.character-context__line').length).toBeGreaterThan(0)
  })

  it('shows name, species, class, level, and primary abilities when available', async () => {
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
      expect(screen.getByText('Elara · Dwarf')).toBeInTheDocument()
    })

    expect(screen.getByText('Fighter 3 · Champion')).toBeInTheDocument()
    expect(
      screen.getByText('Primary abilities: Strength, Dexterity'),
    ).toBeInTheDocument()
  })

  it('shows only identity information before a class is committed', async () => {
    renderSummary({
      character: createDefaultCharacter({
        name: 'Elara',
        species: { speciesId: 'srd-2024:dwarf', choices: {} },
      }),
    })

    await waitFor(() => {
      expect(screen.getByText('Elara · Dwarf')).toBeInTheDocument()
    })

    expect(screen.queryByText(/No class selected/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Primary abilities:/i),
    ).not.toBeInTheDocument()
  })

  it('previews an uncommitted class draft for primary ability guidance', async () => {
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

    expect(
      screen.getByText('Primary abilities: Strength, Dexterity'),
    ).toBeInTheDocument()
  })

  it('uses prioritise wording on the ability scores step', async () => {
    renderSummary({
      activeStepId: 'ability-scores',
      character: {
        ...withSingleClassInstance(createTestFighterClassInstance()),
      },
    })

    await waitFor(() => {
      expect(
        screen.getByText('Prioritise: Strength or Dexterity'),
      ).toBeInTheDocument()
    })
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
      expect(screen.getByText('Elara · Dragonborn')).toBeInTheDocument()
    })
  })
})
