import type { StepStatus } from './types'

export function formatStepStatusDescription(status: StepStatus): string {
  const completionLabel =
    status.completion === 'complete'
      ? 'complete'
      : status.completion === 'in-progress'
        ? 'in progress'
        : 'not started'

  if (status.hasValidationErrors) {
    return `${completionLabel}, needs attention`
  }

  return completionLabel
}

export function formatStepNavAriaLabel(
  stepLabel: string,
  status: StepStatus,
  isActive: boolean,
): string {
  const activeSuffix = isActive ? ', current step' : ''
  return `${stepLabel}, ${formatStepStatusDescription(status)}${activeSuffix}`
}

export function getStepStatusIndicator(status: StepStatus): string {
  if (status.hasValidationErrors) {
    return '!'
  }

  if (status.completion === 'complete') {
    return '✓'
  }

  if (status.completion === 'in-progress') {
    return '•'
  }

  return '○'
}
