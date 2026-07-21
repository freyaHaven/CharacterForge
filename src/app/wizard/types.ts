export type WizardStepId =
  | 'basics'
  | 'species'
  | 'ability-scores'
  | 'class'
  | 'background'
  | 'equipment'
  | 'feats'
  | 'spells'
  | 'review'

export type StepCompletion = 'not-started' | 'in-progress' | 'complete'

export type StepStatus = {
  completion: StepCompletion
  /** Derived from validators; not stored. True when the step has blocking validation issues. */
  hasValidationErrors: boolean
}

export type WizardStepVisibility =
  | { kind: 'always' }
  | { kind: 'conditional'; when: 'feats' | 'spells' }

export type WizardStepDefinition = {
  id: WizardStepId
  label: string
  required: boolean
  visibility?: WizardStepVisibility
}

/** UI-only wizard state. Not part of the domain Character model. */
export type WizardUiState = {
  activeStepId: WizardStepId
}
