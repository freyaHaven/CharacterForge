import type { ComponentProps } from 'react'
import { BackgroundPicker } from '../../../features/background/BackgroundPicker'
import {
  CharacterDetailsSection,
  type CharacterDetailsSectionProps,
} from '../../../features/character-details/CharacterDetailsSection'

export type BackgroundStepProps = ComponentProps<typeof BackgroundPicker> &
  CharacterDetailsSectionProps

export function BackgroundStep({
  speciesSelection,
  details,
  speciesCatalog,
  onDetailsChange,
  onDetailsTouched,
  ...backgroundPickerProps
}: BackgroundStepProps) {
  return (
    <div className="wizard-step-panel background-step">
      <BackgroundPicker {...backgroundPickerProps} />
      <CharacterDetailsSection
        speciesSelection={speciesSelection}
        details={details}
        speciesCatalog={speciesCatalog}
        onDetailsChange={onDetailsChange}
        onDetailsTouched={onDetailsTouched}
      />
    </div>
  )
}
