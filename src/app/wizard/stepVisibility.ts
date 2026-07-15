import type { Character } from '../../domain/types'
import { WIZARD_STEPS } from './steps'
import type { WizardStepDefinition } from './types'

export type WizardStepContext = {
  character: Character
}

export function hasFeatChoices(_context: WizardStepContext): boolean {
  return false
}

export function hasSpellSelections(_context: WizardStepContext): boolean {
  return false
}

export function isWizardStepVisible(
  step: WizardStepDefinition,
  context: WizardStepContext,
): boolean {
  if (step.visibility === undefined || step.visibility.kind === 'always') {
    return true
  }

  if (step.visibility.when === 'feats') {
    return hasFeatChoices(context)
  }

  if (step.visibility.when === 'spells') {
    return hasSpellSelections(context)
  }

  return true
}

export function getVisibleWizardSteps(
  context: WizardStepContext,
): readonly WizardStepDefinition[] {
  return WIZARD_STEPS.filter((step) => isWizardStepVisible(step, context))
}

export function createWizardStepContext(
  character: Character,
): WizardStepContext {
  return { character }
}
