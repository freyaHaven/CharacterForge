import type { ComponentProps } from 'react'
import { SpeciesPicker } from '../../../features/species/SpeciesPicker'

export type SpeciesStepProps = ComponentProps<typeof SpeciesPicker>

export function SpeciesStep(props: SpeciesStepProps) {
  return (
    <div className="wizard-step-panel">
      <SpeciesPicker {...props} />
    </div>
  )
}
