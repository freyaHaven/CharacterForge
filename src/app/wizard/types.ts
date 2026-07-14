export type WizardStepId =
  | 'basics'
  | 'species'
  | 'class'
  | 'ability-scores'
  | 'background'
  | 'equipment'
  | 'review'

export type StepCompletion = 'not-started' | 'in-progress' | 'complete'

export type StepStatus = {
  completion: StepCompletion
  /** Derived from validators; not stored. True when the step has blocking validation issues. */
  hasValidationErrors: boolean
}

export type WizardStepDefinition = {
  id: WizardStepId
  label: string
  required: boolean
}

/** UI-only wizard state. Not part of the domain Character model. */
export type WizardUiState = {
  activeStepId: WizardStepId
}
