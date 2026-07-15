// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReviewStep } from './ReviewStep'

const defaultStatuses = {
  basics: { completion: 'complete' as const, hasValidationErrors: false },
  species: { completion: 'in-progress' as const, hasValidationErrors: true },
  class: { completion: 'not-started' as const, hasValidationErrors: false },
  'ability-scores': { completion: 'complete' as const, hasValidationErrors: false },
  background: { completion: 'not-started' as const, hasValidationErrors: false },
  equipment: { completion: 'not-started' as const, hasValidationErrors: false },
}

const defaultSummaries = {
  basics: ['Name: Aldric', 'Edition: D&D 5e 2024'],
  species: ['Species: Dragonborn', 'Choice incomplete'],
  class: ['Coming soon'],
  'ability-scores': ['Method: Manual', 'STR 10 (+0)'],
  background: ['Not selected'],
  equipment: ['Coming soon'],
}

describe('ReviewStep', () => {
  it('renders all six summary sections with edit actions', () => {
    render(
      <ReviewStep
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        finishPolicy={{
          canFinish: false,
          incompleteRequiredSteps: [{ stepId: 'species', label: 'Species' }],
        }}
        finishBlockedMessage="Complete these required steps before finishing: Species."
        finishMessage={null}
        onEditStep={vi.fn()}
        onFinish={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Review', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basics', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Species', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Class', level: 3 })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ability Scores', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Background', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Equipment', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Species' })).toBeInTheDocument()
    expect(screen.getByText('Choice incomplete')).toBeInTheDocument()
    expect(
      screen.getByText('Needs attention', { selector: '.review-summary-card__warning' }),
    ).toBeInTheDocument()
  })

  it('navigates via edit controls and disables finish when required steps are incomplete', async () => {
    const user = userEvent.setup()
    const onEditStep = vi.fn()

    render(
      <ReviewStep
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        finishPolicy={{
          canFinish: false,
          incompleteRequiredSteps: [{ stepId: 'species', label: 'Species' }],
        }}
        finishBlockedMessage="Complete these required steps before finishing: Species."
        finishMessage={null}
        onEditStep={onEditStep}
        onFinish={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit Ability Scores' }))
    expect(onEditStep).toHaveBeenCalledWith('ability-scores')
    expect(screen.getByRole('button', { name: /finish character/i })).toBeDisabled()
    expect(screen.getByText(/complete these required steps before finishing/i)).toBeInTheDocument()
  })

  it('announces a finish success message when provided', () => {
    render(
      <ReviewStep
        stepStatuses={defaultStatuses}
        summaries={defaultSummaries}
        finishPolicy={{ canFinish: true, incompleteRequiredSteps: [] }}
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
