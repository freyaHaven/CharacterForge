// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { buildReviewSheetModels } from '../../buildReviewSheetModels'
import { ReviewStep } from './ReviewStep'

const emptySheetModels = buildReviewSheetModels({
  character: createDefaultCharacter(),
  speciesDefinition: null,
  backgroundDefinition: null,
  featDefinition: null,
  classDefinitions: new Map(),
})

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
  speciesDisplay: {
    speciesName: 'Dragonborn',
    ancestryLabel: null,
  },
  classDisplay: {
    entries: [],
    className: null,
    subclassName: null,
    level: null,
    characterLevel: null,
    choiceLines: [],
  },
  sheetModels: emptySheetModels,
  pronounsLabel: null,
  age: null,
  alignmentLabel: null,
  hasSpellcastingCapability: false,
  spellLines: [],
  unresolvedDeferredRequirements: [],
}

describe('ReviewStep', () => {
  it('renders an Overview sheet with play-oriented sections', () => {
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

    expect(
      screen.getByRole('heading', { name: 'Aldric', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Dragonborn')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Basics', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Character Details', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Notes', level: 3 }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Statistics', level: 3 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ability Scores', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Proficiency/)).toBeInTheDocument()

    const combatStats = screen.getByLabelText('Combat summary')
    expect(within(combatStats).getByText('Hit Points')).toBeInTheDocument()
    expect(within(combatStats).getByText('Armor Class')).toBeInTheDocument()
    expect(within(combatStats).getByText('Initiative')).toBeInTheDocument()
    expect(within(combatStats).getByText('Speed')).toBeInTheDocument()

    expect(document.querySelector('.ability-score-card__icon')).not.toBeNull()
    expect(
      screen.queryByRole('heading', { name: 'Spellcasting', level: 3 }),
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
        age="42"
        alignmentLabel="Neutral Good"
        stepStatuses={{
          ...defaultStatuses,
          'character-details': {
            completion: 'complete',
            hasValidationErrors: false,
          },
        }}
        summaries={defaultSummaries}
        characterDetailsReview={{
          identity: ['Gender: Male'],
          personality: ['Flaws: Stubborn'],
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
    expect(
      screen.queryByRole('heading', { name: 'Notes', level: 3 }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Identity', level: 4 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personality', level: 4 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Backstory & Notes', level: 4 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Age 42 · Neutral Good · Dragonborn')).toBeInTheDocument()
    expect(screen.queryByText('Age: 42')).not.toBeInTheDocument()
    expect(screen.queryByText('Alignment: Neutral Good')).not.toBeInTheDocument()
    expect(screen.getByText('Gender: Male')).toBeInTheDocument()
    expect(screen.getByText('Flaws: Stubborn')).toBeInTheDocument()
    expect(
      screen.getByText('A long backstory that should wrap cleanly in review.'),
    ).toBeInTheDocument()
  })

  it('shows pronouns, age, and alignment in the header and omits them from Character Details', () => {
    render(
      <ReviewStep
        {...defaultProps}
        pronounsLabel="He/Him"
        age="42"
        alignmentLabel="Neutral Good"
        stepStatuses={{
          ...defaultStatuses,
          'character-details': {
            completion: 'complete',
            hasValidationErrors: false,
          },
        }}
        summaries={defaultSummaries}
        characterDetailsReview={{
          identity: ['Gender: Male'],
          personality: ['Flaws: Stubborn'],
          backstoryNotes: null,
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
      screen.getByRole('heading', {
        name: 'Aldric (He/Him)',
        level: 2,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Age 42 · Neutral Good · Dragonborn')).toBeInTheDocument()
    expect(screen.queryByText('Pronouns: He/Him')).not.toBeInTheDocument()
    expect(screen.queryByText('Age: 42')).not.toBeInTheDocument()
    expect(screen.queryByText('Alignment: Neutral Good')).not.toBeInTheDocument()
    expect(screen.getByText('Gender: Male')).toBeInTheDocument()
  })

  it('shows subclass in the header and name-only subclass lines stay out of Features', () => {
    render(
      <ReviewStep
        {...defaultProps}
        classDisplay={{
          entries: [
            {
              classId: 'srd-2024:fighter',
              className: 'Fighter',
              level: 3,
              subclassName: 'Champion',
            },
          ],
          className: 'Fighter',
          subclassName: 'Champion',
          level: 3,
          characterLevel: 3,
          choiceLines: [
            {
              prompt: 'Choose a Fighting Style',
              summary: 'Defense',
              heading: 'Defense',
              description:
                'While you are wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.',
            },
            {
              prompt: 'Choose a Fighter Subclass',
              summary: 'Champion',
            },
          ],
        }}
        stepStatuses={{
          ...defaultStatuses,
          class: { completion: 'complete', hasValidationErrors: false },
        }}
        summaries={{
          ...defaultSummaries,
          class: [
            'Class: Fighter',
            'Level: 3',
            'Choose a Fighting Style: Defense',
            'Choose a Fighter Subclass: Champion',
          ],
        }}
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

    const identity = screen.getByLabelText('Character identity')
    expect(within(identity).getByText('Level 3')).toBeInTheDocument()

    const classSummary = screen.getByLabelText('Class summary')
    expect(within(classSummary).getByText('Fighter')).toBeInTheDocument()
    expect(within(classSummary).getByText('Champion')).toBeInTheDocument()
    expect(screen.getByText('Defense')).toBeInTheDocument()
    expect(
      screen.getByText(
        /While you are wearing Light, Medium, or Heavy armor/i,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('Choose a Fighting Style')).not.toBeInTheDocument()
    expect(screen.queryByText('Choose a Fighter Subclass')).not.toBeInTheDocument()
  })

  it('shows each multiclass entry with its own level', () => {
    render(
      <ReviewStep
        {...defaultProps}
        classDisplay={{
          entries: [
            {
              classId: 'srd-2024:fighter',
              className: 'Fighter',
              level: 3,
              subclassName: 'Champion',
            },
            {
              classId: 'srd-2024:fighter',
              className: 'Wizard',
              level: 2,
              subclassName: null,
            },
          ],
          className: 'Fighter',
          subclassName: 'Champion',
          level: 3,
          characterLevel: 5,
          choiceLines: [],
        }}
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

    const classSummary = screen.getByLabelText('Class summary')
    expect(within(classSummary).getByText('Fighter')).toBeInTheDocument()
    expect(within(classSummary).getByText('Level 3')).toBeInTheDocument()
    expect(within(classSummary).getByText('Wizard')).toBeInTheDocument()
    expect(within(classSummary).getByText('Level 2')).toBeInTheDocument()
    expect(within(classSummary).getByText('Character level 5')).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: 'Edit ability scores' }))
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
