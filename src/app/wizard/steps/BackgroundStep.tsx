import type { ComponentProps } from 'react'
import { BackgroundPicker } from '../../../features/background/BackgroundPicker'

export type BackgroundStepProps = ComponentProps<typeof BackgroundPicker>

export function BackgroundStep(props: BackgroundStepProps) {
  return (
    <div className="wizard-step-panel">
      <BackgroundPicker {...props} />
    </div>
  )
}
