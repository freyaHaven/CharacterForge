import { WIZARD_STEPS } from './steps'
import type { WizardStepId } from './types'

type WizardStepPanelProps = {
  activeStepId: WizardStepId
}

function getStepLabel(stepId: WizardStepId): string {
  return WIZARD_STEPS.find((step) => step.id === stepId)?.label ?? stepId
}

export function WizardStepPanel({ activeStepId }: WizardStepPanelProps) {
  const label = getStepLabel(activeStepId)
  const headingId = `wizard-step-${activeStepId}-heading`

  return (
    <div className="wizard-step-panel">
      <section aria-labelledby={headingId}>
        <h2 id={headingId}>{label}</h2>
        <p className="wizard-step-panel__placeholder">
          {label} step content will appear here.
        </p>
      </section>
    </div>
  )
}
