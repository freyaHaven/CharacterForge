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
}

/** Two-line nav labels that should never collapse onto one line. */
const WIZARD_NAV_LABEL_LINES: Partial<
  Record<WizardStepId, readonly [string, string]>
> = {}

function WizardNavLabel({
  stepId,
  label,
}: {
  stepId: WizardStepId
  label: string
}) {
  const lines = WIZARD_NAV_LABEL_LINES[stepId]

  if (lines === undefined) {
    return <span className="wizard-nav__label">{label}</span>
  }

  return (
    <span className="wizard-nav__label wizard-nav__label--stacked">
      {lines.map((line) => (
        <span key={line} className="wizard-nav__label-line">
          {line}
        </span>
      ))}
    </span>
  )
}

export function WizardNav({
  activeStepId,
  stepContext,
  stepStatuses,
  onStepChange,
}: WizardNavProps) {
  const visibleSteps = getVisibleWizardSteps(stepContext)

  return (
    <nav aria-label="Character creation steps" className="wizard-nav">
      <ol className="wizard-nav__list">
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
                <WizardNavLabel stepId={step.id} label={step.label} />
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
