import type { ReactNode } from 'react'
import {
  goToNextStep,
  goToPreviousStep,
  type WizardStepContext,
} from './navigation'
import type { StepStatus, WizardStepId } from './types'
import { WizardNav } from './WizardNav'
import { WizardStepPanel } from './WizardStepPanel'
import './wizard.css'

export type CharacterWizardProps = {
  activeStepId: WizardStepId
  stepContext: WizardStepContext
  stepStatuses: Record<WizardStepId, StepStatus>
  onStepChange: (stepId: WizardStepId) => void
  onGoHome?: () => void
  stepContent?: Partial<Record<WizardStepId, ReactNode>>
  characterContext?: ReactNode
  editorActions?: ReactNode
}

export function CharacterWizard({
  activeStepId,
  stepContext,
  stepStatuses,
  onStepChange,
  onGoHome,
  stepContent,
  characterContext,
  editorActions,
}: CharacterWizardProps) {
  const previousStepId = goToPreviousStep(activeStepId, stepContext)
  const nextStepId = goToNextStep(activeStepId, stepContext)

  return (
    <div className="character-wizard">
      <div className="character-wizard__sticky-header">
        <WizardNav
          activeStepId={activeStepId}
          stepContext={stepContext}
          stepStatuses={stepStatuses}
          onStepChange={onStepChange}
          onGoHome={onGoHome}
        />

        {characterContext !== undefined || editorActions !== undefined ? (
          <div className="character-wizard__sticky-bar">
            {characterContext !== undefined ? (
              <div className="character-wizard__sticky-bar-context">
                {characterContext}
              </div>
            ) : null}
            {editorActions !== undefined ? (
              <div className="character-wizard__sticky-bar-actions">
                {editorActions}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="character-wizard__content">
        <WizardStepPanel
          activeStepId={activeStepId}
          stepContent={stepContent}
        />

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
