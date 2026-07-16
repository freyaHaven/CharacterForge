// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CharacterWizard } from '../CharacterWizard'
import {
  createDefaultWizardStepContext,
  getVisibleWizardSteps,
} from '../navigation'
import { WIZARD_STEPS } from '../steps'
import type { StepStatus, WizardStepId } from '../types'

const VISIBLE_STEPS = getVisibleWizardSteps(createDefaultWizardStepContext())

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
  const stepContext = createDefaultWizardStepContext()

  return (
    <CharacterWizard
      activeStepId={activeStepId}
      stepContext={stepContext}
      stepStatuses={stepStatuses}
      onStepChange={setActiveStepId}
    />
  )
}

function getStepButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(`^${label},`, 'i') })
}

describe('CharacterWizard', () => {
  it('renders visible wizard steps in navigation', () => {
    render(<WizardHarness />)

    for (const step of VISIBLE_STEPS) {
      expect(getStepButton(step.label)).toBeInTheDocument()
    }

    expect(
      screen.queryByRole('button', { name: /^Character Details,/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Feats,/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Spells,/i })).not.toBeInTheDocument()
  })


  it('highlights the active step and sets aria-current="step"', () => {
    render(<WizardHarness initialStepId="species" />)

    expect(getStepButton('Basics')).not.toHaveAttribute('aria-current')
    expect(getStepButton('Species')).toHaveAttribute('aria-current', 'step')
  })

  it('navigates directly when a step is clicked', async () => {
    const user = userEvent.setup()
    render(<WizardHarness />)

    await user.click(getStepButton('Abilities'))

    expect(getStepButton('Abilities')).toHaveAttribute(
      'aria-current',
      'step',
    )
    expect(
      screen.getByRole('heading', { name: 'Abilities' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/abilities step content will appear here/i),
    ).toBeInTheDocument()
  })

  it('moves to the next step with Next and to the previous step with Back', async () => {
    const user = userEvent.setup()
    render(<WizardHarness initialStepId="class" />)

    await user.click(screen.getByRole('button', { name: /^next$/i }))
    expect(getStepButton('Background')).toHaveAttribute('aria-current', 'step')

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
    expect(getStepButton('Abilities')).toHaveAccessibleName(/in progress/i)
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
    const speciesIndicator = within(getStepButton('Species')).getByText('4', {
      selector: '[aria-hidden="true"]',
    })
    const classIndicator = within(getStepButton('Class')).getByText('2', {
      selector: '[aria-hidden="true"]',
    })

    expect(basicsIndicator).toHaveAttribute('data-status', 'complete')
    expect(speciesIndicator).toHaveAttribute('data-status', 'in-progress')
    expect(classIndicator).toHaveAttribute('data-status', 'not-started')
  })

  it('renders numbered step markers for visible steps only', () => {
    render(<WizardHarness />)

    const indicators = document.querySelectorAll(
      '.wizard-nav__indicator[data-step-number]',
    )
    expect(indicators).toHaveLength(VISIBLE_STEPS.length)
    expect(indicators[0]).toHaveAttribute('data-step-number', '1')
    expect(indicators[indicators.length - 1]).toHaveAttribute(
      'data-step-number',
      String(VISIBLE_STEPS.length),
    )
  })

  it('keeps step navigation in the sticky header and Back/Next in the content footer', () => {
    render(<WizardHarness initialStepId="class" />)

    const stickyHeader = document.querySelector(
      '.character-wizard__sticky-header',
    )
    const content = document.querySelector('.character-wizard__content')

    expect(stickyHeader).not.toBeNull()
    expect(content).not.toBeNull()

    expect(
      within(stickyHeader as HTMLElement).getByRole('navigation', {
        name: /character creation steps/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(stickyHeader as HTMLElement).getByRole('button', {
        name: /^class,/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(stickyHeader as HTMLElement).queryByRole('button', {
        name: /^back$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(stickyHeader as HTMLElement).queryByRole('button', {
        name: /^next$/i,
      }),
    ).not.toBeInTheDocument()

    expect(
      within(content as HTMLElement).getByRole('button', { name: /^back$/i }),
    ).toBeInTheDocument()
    expect(
      within(content as HTMLElement).getByRole('button', { name: /^next$/i }),
    ).toBeInTheDocument()
  })

  it('does not render a Home control in wizard navigation', () => {
    render(<WizardHarness />)

    expect(
      screen.queryByRole('button', { name: /return to home/i }),
    ).not.toBeInTheDocument()
  })

  it('keeps step navigation in the sticky header without editor export actions', () => {
    render(<WizardHarness initialStepId="basics" />)

    const stickyHeader = document.querySelector(
      '.character-wizard__sticky-header',
    )

    expect(stickyHeader).not.toBeNull()
    expect(
      within(stickyHeader as HTMLElement).queryByRole('button', {
        name: /export character/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('renders step content outside the sticky header region', () => {
    render(<WizardHarness initialStepId="class" />)

    const stickyHeader = document.querySelector(
      '.character-wizard__sticky-header',
    )
    const content = document.querySelector('.character-wizard__content')

    expect(stickyHeader).not.toBeNull()
    expect(content).not.toBeNull()
    expect(stickyHeader?.contains(content as Node)).toBe(false)
    expect(
      within(content as HTMLElement).getByRole('heading', { name: 'Class' }),
    ).toBeInTheDocument()
  })

  it('renders character context inside the sticky header when provided', () => {
    render(
      <CharacterWizard
        activeStepId="class"
        stepContext={createDefaultWizardStepContext()}
        stepStatuses={createStepStatuses()}
        onStepChange={() => {}}
        characterContext={
          <aside
            aria-label="Character context"
            data-testid="character-context-summary"
          >
            Elara · Dwarf
          </aside>
        }
      />,
    )

    const stickyHeader = document.querySelector(
      '.character-wizard__sticky-header',
    )

    expect(stickyHeader).not.toBeNull()
    expect(
      within(stickyHeader as HTMLElement).getByTestId(
        'character-context-summary',
      ),
    ).toHaveTextContent('Elara · Dwarf')
  })
})
