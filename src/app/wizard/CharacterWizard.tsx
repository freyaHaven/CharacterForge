import { goToNextStep, goToPreviousStep } from './navigation'
import type { StepStatus, WizardStepId } from './types'
import { WizardNav } from './WizardNav'
import { WizardStepPanel } from './WizardStepPanel'
import './wizard.css'

export type CharacterWizardProps = {
  activeStepId: WizardStepId
  stepStatuses: Record<WizardStepId, StepStatus>
  onStepChange: (stepId: WizardStepId) => void
}

export function CharacterWizard({
  activeStepId,
  stepStatuses,
  onStepChange,
}: CharacterWizardProps) {
  const previousStepId = goToPreviousStep(activeStepId)
  const nextStepId = goToNextStep(activeStepId)

  return (
    <div className="character-wizard">
      <WizardNav
        activeStepId={activeStepId}
        stepStatuses={stepStatuses}
        onStepChange={onStepChange}
      />

      <div className="character-wizard__content">
        <WizardStepPanel activeStepId={activeStepId} />

        <div className="character-wizard__footer">
          <button
            type="button"
            className="character-wizard__back"
            disabled={previousStepId === null}
            onClick={() => {
              if (previousStepId !== null) {
                onStepChange(previousStepId)
              }
            }}
          >
            Back
          </button>
          <button
            type="button"
            className="character-wizard__next"
            disabled={nextStepId === null}
            onClick={() => {
              if (nextStepId !== null) {
                onStepChange(nextStepId)
              }
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
