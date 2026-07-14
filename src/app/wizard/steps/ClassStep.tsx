import type { ComponentProps } from 'react'
import { ClassPicker } from '../../../features/class/ClassPicker'

export type ClassStepProps = ComponentProps<typeof ClassPicker>

export function ClassStep(props: ClassStepProps) {
  return (
    <div className="wizard-step-panel">
      <ClassPicker {...props} />
    </div>
  )
}
