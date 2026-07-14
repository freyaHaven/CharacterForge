import { WIZARD_STEPS } from './steps'
import type { WizardStepId } from './types'

export function isKnownWizardStepId(value: string): value is WizardStepId {
  return WIZARD_STEPS.some((step) => step.id === value)
}

export function getStepIndex(stepId: WizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId)
}

export function getAdjacentStep(
  currentStepId: WizardStepId,
  direction: 'next' | 'previous',
): WizardStepId | null {
  const currentIndex = getStepIndex(currentStepId)

  if (currentIndex === -1) {
    return null
  }

  const offset = direction === 'next' ? 1 : -1
  const adjacentStep = WIZARD_STEPS[currentIndex + offset]

  return adjacentStep?.id ?? null
}

export function goToNextStep(currentStepId: string): WizardStepId | null {
  if (!isKnownWizardStepId(currentStepId)) {
    return null
  }

  return getAdjacentStep(currentStepId, 'next')
}

export function goToPreviousStep(currentStepId: string): WizardStepId | null {
  if (!isKnownWizardStepId(currentStepId)) {
    return null
  }

  return getAdjacentStep(currentStepId, 'previous')
}

export function canNavigateToStep(targetStepId: string): boolean {
  return isKnownWizardStepId(targetStepId)
}
