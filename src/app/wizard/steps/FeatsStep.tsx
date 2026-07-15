import type { ComponentProps } from 'react'
import { FeatPicker } from '../../../features/feat/FeatPicker'

export type FeatsStepProps = ComponentProps<typeof FeatPicker>

export function FeatsStep(props: FeatsStepProps) {
  return (
    <div className="wizard-step-panel">
      <FeatPicker {...props} />
    </div>
  )
}
