import { getVisibleWizardSteps, type WizardStepContext } from './stepVisibility'
import type { StepStatus, WizardStepId } from './types'
import {
  formatStepNavAriaLabel,
  getStepStatusIndicator,
} from './formatStepStatus'

type WizardNavProps = {
  activeStepId: WizardStepId
  stepContext: WizardStepContext
  stepStatuses: Record<WizardStepId, StepStatus>
  onStepChange: (stepId: WizardStepId) => void
  onGoHome?: () => void
}

export function WizardNav({
  activeStepId,
  stepContext,
  stepStatuses,
  onStepChange,
  onGoHome,
}: WizardNavProps) {
  const visibleSteps = getVisibleWizardSteps(stepContext)

  return (
    <nav aria-label="Character creation steps" className="wizard-nav">
      <ol className="wizard-nav__list">
        {onGoHome !== undefined ? (
          <li className="wizard-nav__item wizard-nav__item--home">
            <button
              type="button"
              className="wizard-nav__step wizard-nav__home"
              aria-label="Return to home"
              onClick={onGoHome}
            >
              <span className="wizard-nav__indicator" aria-hidden="true">
                ⌂
              </span>
              <span className="wizard-nav__label">Home</span>
            </button>
          </li>
        ) : null}
        {visibleSteps.map((step, index) => {
          const status = stepStatuses[step.id]
          const isActive = step.id === activeStepId
          const stepNumber = index + 1

          return (
            <li key={step.id} className="wizard-nav__item">
              <button
                type="button"
                className={[
                  'wizard-nav__step',
                  isActive ? 'wizard-nav__step--active' : '',
                  status.hasValidationErrors
                    ? 'wizard-nav__step--warning'
                    : '',
                  status.completion === 'complete'
                    ? 'wizard-nav__step--complete'
                    : '',
                  status.completion === 'not-started' && !isActive
                    ? 'wizard-nav__step--upcoming'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={isActive ? 'step' : undefined}
                aria-label={formatStepNavAriaLabel(step.label, status, isActive)}
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className="wizard-nav__indicator"
                  aria-hidden="true"
                  data-status={status.completion}
                  data-step-number={stepNumber}
                  data-validation-warning={
                    status.hasValidationErrors ? 'true' : undefined
                  }
                >
                  {getStepStatusIndicator(status, stepNumber)}
                </span>
                <span className="wizard-nav__label">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
