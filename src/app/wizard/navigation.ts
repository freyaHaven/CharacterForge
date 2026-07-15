import { createDefaultCharacter } from '../../domain/character/defaults'
import { WIZARD_STEPS } from './steps'
import {
  createWizardStepContext,
  getVisibleWizardSteps,
  type WizardStepContext,
} from './stepVisibility'
import type { WizardStepId } from './types'

export type { WizardStepContext } from './stepVisibility'
export {
  createWizardStepContext,
  getVisibleWizardSteps,
  hasFeatChoices,
  hasSpellSelections,
  isWizardStepVisible,
} from './stepVisibility'

export function isKnownWizardStepId(value: string): value is WizardStepId {
  return WIZARD_STEPS.some((step) => step.id === value)
}

export function getStepIndex(stepId: WizardStepId): number {
  return WIZARD_STEPS.findIndex((step) => step.id === stepId)
}

export function getAdjacentStep(
  currentStepId: WizardStepId,
  direction: 'next' | 'previous',
  context: WizardStepContext,
): WizardStepId | null {
  const visibleSteps = getVisibleWizardSteps(context)
  const currentIndex = visibleSteps.findIndex((step) => step.id === currentStepId)

  if (currentIndex === -1) {
    return null
  }

  const offset = direction === 'next' ? 1 : -1
  const adjacentStep = visibleSteps[currentIndex + offset]

  return adjacentStep?.id ?? null
}

export function goToNextStep(
  currentStepId: string,
  context: WizardStepContext,
): WizardStepId | null {
  if (!isKnownWizardStepId(currentStepId)) {
    return null
  }

  return getAdjacentStep(currentStepId, 'next', context)
}

export function goToPreviousStep(
  currentStepId: string,
  context: WizardStepContext,
): WizardStepId | null {
  if (!isKnownWizardStepId(currentStepId)) {
    return null
  }

  return getAdjacentStep(currentStepId, 'previous', context)
}

export function canNavigateToStep(
  targetStepId: string,
  context: WizardStepContext,
): boolean {
  if (!isKnownWizardStepId(targetStepId)) {
    return false
  }

  const step = WIZARD_STEPS.find((entry) => entry.id === targetStepId)

  if (step === undefined) {
    return false
  }

  return getVisibleWizardSteps(context).some((entry) => entry.id === step.id)
}

export function createDefaultWizardStepContext(): WizardStepContext {
  return createWizardStepContext(createDefaultCharacter())
}
