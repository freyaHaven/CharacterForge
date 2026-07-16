import { AbilityScoresForm } from '../../../features/ability-scores/AbilityScoresForm'
import type { ComponentProps } from 'react'

export type AbilityScoresStepProps = ComponentProps<typeof AbilityScoresForm>

export function AbilityScoresStep(props: AbilityScoresStepProps) {
  return (
    <section
      aria-labelledby="wizard-step-ability-scores-heading"
      className="wizard-step-panel"
    >
      <AbilityScoresForm {...props} />
    </section>
  )
}
