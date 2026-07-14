import { describe, expect, it } from 'vitest'
import {
  formatIncompleteRequiredStepsMessage,
  getFinishPolicyResult,
} from './characterFinishPolicy'
import type { StepStatus, WizardStepId } from './wizard/types'

function createStatuses(
  overrides: Partial<Record<WizardStepId, StepStatus>> = {},
): Record<WizardStepId, StepStatus> {
  const defaultStatus: StepStatus = {
    completion: 'not-started',
    hasValidationErrors: false,
  }

  return {
    basics: defaultStatus,
    species: defaultStatus,
    class: defaultStatus,
    'ability-scores': defaultStatus,
    background: defaultStatus,
    equipment: defaultStatus,
    review: { completion: 'in-progress', hasValidationErrors: false },
    ...overrides,
  }
}

describe('getFinishPolicyResult', () => {
  it('allows finishing when all required steps are complete', () => {
    expect(
      getFinishPolicyResult(
        createStatuses({
          basics: { completion: 'complete', hasValidationErrors: false },
          species: { completion: 'complete', hasValidationErrors: false },
          class: { completion: 'complete', hasValidationErrors: false },
          'ability-scores': { completion: 'complete', hasValidationErrors: false },
        }),
      ),
    ).toEqual({
      canFinish: true,
      incompleteRequiredSteps: [],
    })
  })

  it('blocks finishing when a required step is incomplete', () => {
    expect(
      getFinishPolicyResult(
        createStatuses({
          basics: { completion: 'complete', hasValidationErrors: false },
          species: { completion: 'in-progress', hasValidationErrors: true },
          class: { completion: 'complete', hasValidationErrors: false },
          'ability-scores': { completion: 'complete', hasValidationErrors: false },
        }),
      ),
    ).toEqual({
      canFinish: false,
      incompleteRequiredSteps: [{ stepId: 'species', label: 'Species' }],
    })
  })

  it('does not block finishing because optional placeholder steps are incomplete', () => {
    expect(
      getFinishPolicyResult(
        createStatuses({
          basics: { completion: 'complete', hasValidationErrors: false },
          species: { completion: 'complete', hasValidationErrors: false },
          class: { completion: 'complete', hasValidationErrors: false },
          'ability-scores': { completion: 'complete', hasValidationErrors: false },
          background: { completion: 'not-started', hasValidationErrors: false },
          equipment: { completion: 'not-started', hasValidationErrors: false },
        }),
      ).canFinish,
    ).toBe(true)
  })
})

describe('formatIncompleteRequiredStepsMessage', () => {
  it('lists the incomplete required step labels', () => {
    expect(
      formatIncompleteRequiredStepsMessage([
        { stepId: 'basics', label: 'Basics' },
        { stepId: 'species', label: 'Species' },
      ]),
    ).toBe(
      'Complete these required steps before finishing: Basics, Species.',
    )
  })
})
