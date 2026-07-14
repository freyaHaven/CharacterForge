import { describe, expect, it } from 'vitest'
import { WIZARD_STEPS } from './steps'
import type { StepStatus, WizardStepId } from './types'
import {
  canNavigateToStep,
  getAdjacentStep,
  getStepIndex,
  goToNextStep,
  goToPreviousStep,
  isKnownWizardStepId,
} from './navigation'

const STEP_IDS = WIZARD_STEPS.map((step) => step.id)

describe('isKnownWizardStepId', () => {
  it('recognises every configured step ID', () => {
    for (const stepId of STEP_IDS) {
      expect(isKnownWizardStepId(stepId)).toBe(true)
    }
  })

  it('rejects unknown step IDs', () => {
    expect(isKnownWizardStepId('invalid-step')).toBe(false)
    expect(isKnownWizardStepId('')).toBe(false)
  })
})

describe('getStepIndex', () => {
  it('returns the index of each step in WIZARD_STEPS order', () => {
    STEP_IDS.forEach((stepId, index) => {
      expect(getStepIndex(stepId)).toBe(index)
    })
  })
})

describe('getAdjacentStep', () => {
  it('returns the next step for every step except the last', () => {
    for (let index = 0; index < STEP_IDS.length - 1; index += 1) {
      const currentStepId = STEP_IDS[index]
      const expectedNextStepId = STEP_IDS[index + 1]

      expect(getAdjacentStep(currentStepId, 'next')).toBe(expectedNextStepId)
    }
  })

  it('returns the previous step for every step except the first', () => {
    for (let index = 1; index < STEP_IDS.length; index += 1) {
      const currentStepId = STEP_IDS[index]
      const expectedPreviousStepId = STEP_IDS[index - 1]

      expect(getAdjacentStep(currentStepId, 'previous')).toBe(
        expectedPreviousStepId,
      )
    }
  })

  it('returns null when there is no next step', () => {
    expect(getAdjacentStep('review', 'next')).toBeNull()
  })

  it('returns null when there is no previous step', () => {
    expect(getAdjacentStep('basics', 'previous')).toBeNull()
  })
})

describe('goToNextStep', () => {
  it('walks forward through every step in order', () => {
    let currentStepId: WizardStepId | null = 'basics'

    for (let index = 1; index < STEP_IDS.length; index += 1) {
      currentStepId = goToNextStep(currentStepId!)
      expect(currentStepId).toBe(STEP_IDS[index])
    }

    expect(goToNextStep(currentStepId!)).toBeNull()
  })

  it('returns null from the last step', () => {
    expect(goToNextStep('review')).toBeNull()
  })

  it('returns null for unknown step IDs', () => {
    expect(goToNextStep('not-a-step')).toBeNull()
  })
})

describe('goToPreviousStep', () => {
  it('walks backward through every step in order', () => {
    let currentStepId: WizardStepId | null = 'review'

    for (let index = STEP_IDS.length - 2; index >= 0; index -= 1) {
      currentStepId = goToPreviousStep(currentStepId!)
      expect(currentStepId).toBe(STEP_IDS[index])
    }

    expect(goToPreviousStep(currentStepId!)).toBeNull()
  })

  it('returns null from the first step', () => {
    expect(goToPreviousStep('basics')).toBeNull()
  })

  it('returns null for unknown step IDs', () => {
    expect(goToPreviousStep('not-a-step')).toBeNull()
  })
})

describe('canNavigateToStep', () => {
  it('allows jumping directly to any configured step', () => {
    for (const stepId of STEP_IDS) {
      expect(canNavigateToStep(stepId)).toBe(true)
    }
  })

  it('rejects unknown step IDs', () => {
    expect(canNavigateToStep('invalid-step')).toBe(false)
    expect(canNavigateToStep('')).toBe(false)
  })

  it('does not depend on completion status', () => {
    const statusesWithErrors: Record<WizardStepId, StepStatus> = {
      basics: { completion: 'in-progress', hasValidationErrors: true },
      species: { completion: 'not-started', hasValidationErrors: false },
      class: { completion: 'not-started', hasValidationErrors: false },
      'ability-scores': {
        completion: 'in-progress',
        hasValidationErrors: true,
      },
      background: { completion: 'not-started', hasValidationErrors: false },
      equipment: { completion: 'not-started', hasValidationErrors: false },
      review: { completion: 'not-started', hasValidationErrors: false },
    }

    for (const stepId of STEP_IDS) {
      expect(canNavigateToStep(stepId)).toBe(true)
      expect(statusesWithErrors[stepId].hasValidationErrors).toBeDefined()
    }
  })
})
