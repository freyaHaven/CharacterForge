// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewStep } from './ReviewStep'

const emptyCharacterDetailsReview = {
  identity: [],
  personality: [],
  backstoryNotes: null,
}

const defaultStatuses = {
  basics: { completion: 'complete' as const, hasValidationErrors: false },
  species: { completion: 'in-progress' as const, hasValidationErrors: true },
  'character-details': {
    completion: 'not-started' as const,
    hasValidationErrors: false,
  },
  class: { completion: 'not-started' as const, hasValidationErrors: false },
  'ability-scores': { completion: 'complete' as const, hasValidationErrors: false },
  background: { completion: 'not-started' as const, hasValidationErrors: false },
  equipment: { completion: 'not-started' as const, hasValidationErrors: false },
  feats: { completion: 'not-started' as const, hasValidationErrors: false },
  spells: { completion: 'not-started' as const, hasValidationErrors: false },
}

const defaultSummaries = {
  basics: ['Name: Aldric', 'Edition: D&D 5e 2024'],
  species: ['Species: Dragonborn', 'Choice incomplete'],
  'character-details': [],
  class: ['Coming soon'],
  'ability-scores': ['Method: Manual', 'STR 10 (+0)'],
  background: ['Not selected'],
  equipment: ['Coming soon'],
  feats: ['Not selected'],
  spells: ['Coming soon'],
}

const defaultProps = {
  characterName: 'Aldric',
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  speciesId: 'srd-2024:dragonborn',
  classId: null,
  speciesDisplay: {
    speciesName: 'Dragonborn',
    ancestryLabel: null,
  },
  classDisplay: {
    className: null,
    level: null,
    choiceLines: [],
  },
  hasSpellcastingCapability: false,
  spellLines: [],
  unresolvedDeferredRequirements: [],
}

describe('ReviewStep', () => {
  it('renders a character sheet layout with grouped sections and edit actions', () => {
    render(
      <ReviewStep
        {...defaultProps}
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        characterDetailsReview={emptyCharacterDetailsReview}
        finishPolicy={{
          canFinish: false,
          incompleteRequiredSteps: [{ stepId: 'species', label: 'Species' }],
          unresolvedDeferredRequirements: [],
        }}
        finishBlockedMessage="Complete these required steps before finishing: Species."
        finishMessage={null}
        onEditStep={vi.fn()}
        onFinish={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Aldric', level: 2 })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Basics', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Character Details', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ability Scores', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Core Statistics', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Spells', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Equipment', level: 3 }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Ability scores' })).toBeInTheDocument()
    expect(
      screen.getAllByText('+0', { selector: '.ability-score-card__modifier' }).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText('Some sections still need attention before you can finish your character.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Edition: D&D 5e 2024')).not.toBeInTheDocument()
  })

  it('shows sectioned Character Details when populated fields exist', () => {
    render(
      <ReviewStep
        {...defaultProps}
        stepStatuses={{
          ...defaultStatuses,
          'character-details': {
            completion: 'complete',
            hasValidationErrors: false,
          },
        }}
        summaries={defaultSummaries}
        characterDetailsReview={{
          identity: ['Age: 42'],
          personality: ['Alignment: Neutral Good', 'Flaws: Stubborn'],
          backstoryNotes: 'A long backstory that should wrap cleanly in review.',
        }}
        finishPolicy={{
          canFinish: true,
          incompleteRequiredSteps: [],
          unresolvedDeferredRequirements: [],
        }}
        finishBlockedMessage=""
        finishMessage={null}
        onEditStep={vi.fn()}
        onFinish={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Character Details', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personality', level: 4 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Age: 42')).toBeInTheDocument()
    expect(screen.getByText('Alignment: Neutral Good')).toBeInTheDocument()
    expect(
      screen.getByText('A long backstory that should wrap cleanly in review.'),
    ).toBeInTheDocument()
  })

  it('navigates via edit controls and disables finish when required steps are incomplete', async () => {
    const user = userEvent.setup()
    const onEditStep = vi.fn()

    render(
      <ReviewStep
        {...defaultProps}
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        characterDetailsReview={emptyCharacterDetailsReview}
        finishPolicy={{
          canFinish: false,
          incompleteRequiredSteps: [{ stepId: 'species', label: 'Species' }],
          unresolvedDeferredRequirements: [],
        }}
        finishBlockedMessage="Complete these required steps before finishing: Species."
        finishMessage={null}
        onEditStep={onEditStep}
        onFinish={vi.fn()}
      />,
    )

    const abilityScoresSection = screen
      .getByRole('heading', { name: 'Ability Scores', level: 3 })
      .closest('section') as HTMLElement

    await user.click(within(abilityScoresSection).getByRole('button', { name: 'Edit' }))
    expect(onEditStep).toHaveBeenCalledWith('ability-scores')
    expect(screen.getByRole('button', { name: /finish character/i })).toBeDisabled()
  })

  it('announces a finish success message when provided', () => {
    render(
      <ReviewStep
        {...defaultProps}
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        characterDetailsReview={emptyCharacterDetailsReview}
        finishPolicy={{
          canFinish: true,
          incompleteRequiredSteps: [],
          unresolvedDeferredRequirements: [],
        }}
        finishBlockedMessage=""
        finishMessage="Character complete."
        onEditStep={vi.fn()}
        onFinish={vi.fn()}
      />,
    )

    expect(screen.getByText('Character complete.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finish character/i })).toBeEnabled()
  })
})
