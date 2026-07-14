// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CharacterWizard } from './CharacterWizard'
import { WIZARD_STEPS } from './steps'
import type { StepStatus, WizardStepId } from './types'

function createStepStatuses(
  overrides: Partial<Record<WizardStepId, StepStatus>> = {},
): Record<WizardStepId, StepStatus> {
  const defaultStatus: StepStatus = {
    completion: 'not-started',
    hasValidationErrors: false,
  }

  return WIZARD_STEPS.reduce(
    (statuses, step) => {
      statuses[step.id] = overrides[step.id] ?? defaultStatus
      return statuses
    },
    {} as Record<WizardStepId, StepStatus>,
  )
}

function WizardHarness({
  initialStepId = 'basics',
  stepStatuses = createStepStatuses(),
}: {
  initialStepId?: WizardStepId
  stepStatuses?: Record<WizardStepId, StepStatus>
}) {
  const [activeStepId, setActiveStepId] = useState(initialStepId)

  return (
    <CharacterWizard
      activeStepId={activeStepId}
      stepStatuses={stepStatuses}
      onStepChange={setActiveStepId}
    />
  )
}

function getStepButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label},`, 'i') })
}

describe('CharacterWizard', () => {
  it('renders all seven wizard steps in navigation', () => {
    render(<WizardHarness />)

    for (const step of WIZARD_STEPS) {
      expect(getStepButton(step.label)).toBeInTheDocument()
    }
  })

  it('highlights the active step and sets aria-current="step"', () => {
    render(<WizardHarness initialStepId="species" />)

    expect(getStepButton('Basics')).not.toHaveAttribute('aria-current')
    expect(getStepButton('Species')).toHaveAttribute('aria-current', 'step')
  })

  it('navigates directly when a step is clicked', async () => {
    const user = userEvent.setup()
    render(<WizardHarness />)

    await user.click(getStepButton('Ability Scores'))

    expect(getStepButton('Ability Scores')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(
      screen.getByRole('heading', { name: 'Ability Scores' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ability scores step content will appear here/i),
    ).toBeInTheDocument()
  })

  it('moves to the next step with Next and to the previous step with Back', async () => {
    const user = userEvent.setup()
    render(<WizardHarness initialStepId="class" />)

    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(getStepButton('Ability Scores')).toHaveAttribute(
      'aria-current',
      'step',
    )

    await user.click(screen.getByRole('button', { name: /^back$/i }))
    expect(getStepButton('Class')).toHaveAttribute('aria-current', 'step')
  })

  it('disables Back on the first step and Next on the last step', () => {
    render(<WizardHarness initialStepId="basics" />)

    expect(screen.getByRole('button', { name: /^back$/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled()
  })

  it('disables Next on the last step', () => {
    render(<WizardHarness initialStepId="review" />)

    expect(screen.getByRole('button', { name: /^back$/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled()
  })

  it('uses semantic step navigation without tab roles', () => {
    render(<WizardHarness />)

    expect(
      screen.getByRole('navigation', { name: /character creation steps/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('renders accessible status labels and validation warnings in step buttons', () => {
    render(
      <WizardHarness
        stepStatuses={createStepStatuses({
          basics: { completion: 'complete', hasValidationErrors: false },
          species: {
            completion: 'in-progress',
            hasValidationErrors: true,
          },
          'ability-scores': {
            completion: 'in-progress',
            hasValidationErrors: false,
          },
        })}
      />,
    )

    expect(getStepButton('Basics')).toHaveAccessibleName(/complete/i)
    expect(getStepButton('Species')).toHaveAccessibleName(/needs attention/i)
    expect(getStepButton('Ability Scores')).toHaveAccessibleName(/in progress/i)
    expect(getStepButton('Class')).toHaveAccessibleName(/not started/i)

    const speciesButton = getStepButton('Species')
    expect(
      within(speciesButton).getByText('!', { selector: '[aria-hidden="true"]' }),
    ).toBeInTheDocument()
  })

  it('shows status indicators for complete, in-progress, and not-started steps', () => {
    render(
      <WizardHarness
        stepStatuses={createStepStatuses({
          basics: { completion: 'complete', hasValidationErrors: false },
          species: {
            completion: 'in-progress',
            hasValidationErrors: false,
          },
        })}
      />,
    )

    const basicsIndicator = within(getStepButton('Basics')).getByText('✓', {
      selector: '[aria-hidden="true"]',
    })
    const speciesIndicator = within(getStepButton('Species')).getByText('•', {
      selector: '[aria-hidden="true"]',
    })
    const classIndicator = within(getStepButton('Class')).getByText('○', {
      selector: '[aria-hidden="true"]',
    })

    expect(basicsIndicator).toHaveAttribute('data-status', 'complete')
    expect(speciesIndicator).toHaveAttribute('data-status', 'in-progress')
    expect(classIndicator).toHaveAttribute('data-status', 'not-started')
  })
})
