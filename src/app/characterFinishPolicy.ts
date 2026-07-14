import { WIZARD_STEPS } from './wizard/steps'
import type { StepStatus, WizardStepId } from './wizard/types'

export type IncompleteRequiredStep = {
  stepId: WizardStepId
  label: string
}

export type FinishPolicyResult =
  | {
      canFinish: true
      incompleteRequiredSteps: []
    }
  | {
      canFinish: false
      incompleteRequiredSteps: IncompleteRequiredStep[]
    }

export function getFinishPolicyResult(
  stepStatuses: Record<WizardStepId, StepStatus>,
): FinishPolicyResult {
  const incompleteRequiredSteps = WIZARD_STEPS.filter(
    (step) => step.required && step.id !== 'review',
  )
    .filter((step) => stepStatuses[step.id].completion !== 'complete')
    .map((step) => ({
      stepId: step.id,
      label: step.label,
    }))

  if (incompleteRequiredSteps.length === 0) {
    return { canFinish: true, incompleteRequiredSteps: [] }
  }

  return { canFinish: false, incompleteRequiredSteps }
}

export function formatIncompleteRequiredStepsMessage(
  incompleteRequiredSteps: IncompleteRequiredStep[],
): string {
  if (incompleteRequiredSteps.length === 0) {
    return ''
  }

  const stepLabels = incompleteRequiredSteps.map((step) => step.label).join(', ')
  return `Complete these required steps before finishing: ${stepLabels}.`
}
