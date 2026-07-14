import { AbilityScoresForm } from '../../../features/ability-scores/AbilityScoresForm'
import type { ComponentProps } from 'react'

export type AbilityScoresStepProps = ComponentProps<typeof AbilityScoresForm>

export function AbilityScoresStep(props: AbilityScoresStepProps) {
  return (
    <section
      aria-labelledby="wizard-step-ability-scores-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-ability-scores-heading">Ability Scores</h2>
      <AbilityScoresForm {...props} />
    </section>
  )
}
