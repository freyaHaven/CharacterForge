import type { Character } from '../../domain/types'
import { WIZARD_STEPS } from './steps'
import type { WizardStepDefinition } from './types'

export type WizardStepContext = {
  character: Character
  /** Derived: character has any meaningful spell-related content. */
  hasSpellContent?: boolean
}

/**
 * Reserved for future entitlement-driven visibility (background origin feat
 * grants, class ASI feat slots). Feats stays in the catalog but is hidden from
 * the wizard nav until it is incorporated into another flow.
 */
export function hasFeatChoices(_context: WizardStepContext): boolean {
  return false
}

/** Spells step appears when the character has any spell content (including grants-only). */
export function hasSpellContent(context: WizardStepContext): boolean {
  return context.hasSpellContent === true
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
    return hasSpellContent(context)
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
  options?: { hasSpellContent?: boolean },
): WizardStepContext {
  return {
    character,
    hasSpellContent: options?.hasSpellContent,
  }
}
