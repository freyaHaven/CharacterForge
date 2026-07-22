import { describe, expect, it } from 'vitest'
import { WIZARD_STEPS } from '../steps'
import type { StepStatus, WizardStepId } from '../types'
import {
  canNavigateToStep,
  createDefaultWizardStepContext,
  getAdjacentStep,
  getStepIndex,
  getVisibleWizardSteps,
  goToNextStep,
  goToPreviousStep,
  isKnownWizardStepId,
} from '../navigation'

const STEP_IDS = WIZARD_STEPS.map((step) => step.id)
const DEFAULT_CONTEXT = createDefaultWizardStepContext()
const VISIBLE_STEP_IDS = getVisibleWizardSteps(DEFAULT_CONTEXT).map(
  (step) => step.id,
)

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
  it('returns the next visible step for every step except the last', () => {
    for (let index = 0; index < VISIBLE_STEP_IDS.length - 1; index += 1) {
      const currentStepId = VISIBLE_STEP_IDS[index]
      const expectedNextStepId = VISIBLE_STEP_IDS[index + 1]

      expect(getAdjacentStep(currentStepId, 'next', DEFAULT_CONTEXT)).toBe(
        expectedNextStepId,
      )
    }
  })

  it('returns the previous visible step for every step except the first', () => {
    for (let index = 1; index < VISIBLE_STEP_IDS.length; index += 1) {
      const currentStepId = VISIBLE_STEP_IDS[index]
      const expectedPreviousStepId = VISIBLE_STEP_IDS[index - 1]

      expect(getAdjacentStep(currentStepId, 'previous', DEFAULT_CONTEXT)).toBe(
        expectedPreviousStepId,
      )
    }
  })

  it('returns null when there is no next step', () => {
    expect(getAdjacentStep('review', 'next', DEFAULT_CONTEXT)).toBeNull()
  })

  it('returns null when there is no previous step', () => {
    expect(getAdjacentStep('basics', 'previous', DEFAULT_CONTEXT)).toBeNull()
  })

  it('skips hidden conditional steps', () => {
    expect(getAdjacentStep('basics', 'next', DEFAULT_CONTEXT)).toBe('class')
    expect(getAdjacentStep('class', 'next', DEFAULT_CONTEXT)).toBe('background')
    expect(getAdjacentStep('equipment', 'next', DEFAULT_CONTEXT)).toBe(
      'inventory',
    )
    expect(getAdjacentStep('inventory', 'next', DEFAULT_CONTEXT)).toBe('review')
  })
})

describe('goToNextStep', () => {
  it('walks forward through every visible step in order', () => {
    let currentStepId: WizardStepId | null = 'basics'

    for (let index = 1; index < VISIBLE_STEP_IDS.length; index += 1) {
      currentStepId = goToNextStep(currentStepId!, DEFAULT_CONTEXT)
      expect(currentStepId).toBe(VISIBLE_STEP_IDS[index])
    }

    expect(goToNextStep(currentStepId!, DEFAULT_CONTEXT)).toBeNull()
  })

  it('returns null from the last step', () => {
    expect(goToNextStep('review', DEFAULT_CONTEXT)).toBeNull()
  })

  it('returns null for unknown step IDs', () => {
    expect(goToNextStep('not-a-step', DEFAULT_CONTEXT)).toBeNull()
  })
})

describe('goToPreviousStep', () => {
  it('walks backward through every visible step in order', () => {
    let currentStepId: WizardStepId | null = 'review'

    for (let index = VISIBLE_STEP_IDS.length - 2; index >= 0; index -= 1) {
      currentStepId = goToPreviousStep(currentStepId!, DEFAULT_CONTEXT)
      expect(currentStepId).toBe(VISIBLE_STEP_IDS[index])
    }

    expect(goToPreviousStep(currentStepId!, DEFAULT_CONTEXT)).toBeNull()
  })

  it('returns null from the first step', () => {
    expect(goToPreviousStep('basics', DEFAULT_CONTEXT)).toBeNull()
  })

  it('returns null for unknown step IDs', () => {
    expect(goToPreviousStep('not-a-step', DEFAULT_CONTEXT)).toBeNull()
  })
})

describe('canNavigateToStep', () => {
  it('allows jumping directly to visible steps', () => {
    for (const stepId of VISIBLE_STEP_IDS) {
      expect(canNavigateToStep(stepId, DEFAULT_CONTEXT)).toBe(true)
    }
  })

  it('rejects hidden conditional steps', () => {
    expect(canNavigateToStep('feats', DEFAULT_CONTEXT)).toBe(false)
    expect(canNavigateToStep('spells', DEFAULT_CONTEXT)).toBe(false)
  })

  it('rejects unknown step IDs', () => {
    expect(canNavigateToStep('invalid-step', DEFAULT_CONTEXT)).toBe(false)
    expect(canNavigateToStep('', DEFAULT_CONTEXT)).toBe(false)
    expect(canNavigateToStep('character-details', DEFAULT_CONTEXT)).toBe(false)
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
      feats: { completion: 'not-started', hasValidationErrors: false },
      spells: { completion: 'not-started', hasValidationErrors: false },
      inventory: { completion: 'not-started', hasValidationErrors: false },
      review: { completion: 'not-started', hasValidationErrors: false },
    }

    for (const stepId of VISIBLE_STEP_IDS) {
      expect(canNavigateToStep(stepId, DEFAULT_CONTEXT)).toBe(true)
      expect(statusesWithErrors[stepId].hasValidationErrors).toBeDefined()
    }
  })
})
