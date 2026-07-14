import { WIZARD_STEPS } from './steps'
import type { StepStatus, WizardStepId } from './types'
import {
  formatStepNavAriaLabel,
  getStepStatusIndicator,
} from './formatStepStatus'

type WizardNavProps = {
  activeStepId: WizardStepId
  stepStatuses: Record<WizardStepId, StepStatus>
  onStepChange: (stepId: WizardStepId) => void
}

export function WizardNav({
  activeStepId,
  stepStatuses,
  onStepChange,
}: WizardNavProps) {
  return (
    <nav aria-label="Character creation steps" className="wizard-nav">
      <ol className="wizard-nav__list">
        {WIZARD_STEPS.map((step) => {
          const status = stepStatuses[step.id]
          const isActive = step.id === activeStepId

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
                  data-validation-warning={
                    status.hasValidationErrors ? 'true' : undefined
                  }
                >
                  {getStepStatusIndicator(status)}
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
