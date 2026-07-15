import { WIZARD_STEPS } from './wizard/steps'
import type { ResolvedDeferredCharacterRequirement } from '../domain/types'
import type { StepStatus, WizardStepId } from './wizard/types'

export type IncompleteRequiredStep = {
  stepId: WizardStepId
  label: string
}

export type FinishPolicyResult = {
  canFinish: boolean
  incompleteRequiredSteps: IncompleteRequiredStep[]
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[]
}

export function getFinishPolicyResult(
  stepStatuses: Record<WizardStepId, StepStatus>,
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[] = [],
): FinishPolicyResult {
  const incompleteRequiredSteps = WIZARD_STEPS.filter(
    (step) => step.required && step.id !== 'review',
  )
    .filter((step) => stepStatuses[step.id].completion !== 'complete')
    .map((step) => ({
      stepId: step.id,
      label: step.label,
    }))

  if (incompleteRequiredSteps.length > 0) {
    return {
      canFinish: false,
      incompleteRequiredSteps,
      unresolvedDeferredRequirements,
    }
  }

  if (unresolvedDeferredRequirements.length > 0) {
    return {
      canFinish: false,
      incompleteRequiredSteps: [],
      unresolvedDeferredRequirements,
    }
  }

  return {
    canFinish: true,
    incompleteRequiredSteps: [],
    unresolvedDeferredRequirements: [],
  }
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

export function formatFinishBlockedMessage(result: FinishPolicyResult): string {
  if (result.canFinish) {
    return ''
  }

  if (result.incompleteRequiredSteps.length > 0) {
    return formatIncompleteRequiredStepsMessage(result.incompleteRequiredSteps)
  }

  if (result.unresolvedDeferredRequirements.length > 0) {
    return 'Complete remaining character decisions before finishing your character.'
  }

  return 'Complete the required steps before finishing your character.'
}
