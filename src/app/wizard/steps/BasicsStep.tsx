import type { EditionId } from '../../../domain/types'
import { CharacterBasicsFields } from '../../../features/character-basics/CharacterBasicsFields'

type BasicsStepProps = {
  name: string
  editionId: EditionId
  onNameChange: (name: string) => void
  onEditionChange: (editionId: EditionId) => void
  onBasicsTouched?: () => void
}

export function BasicsStep({
  name,
  editionId,
  onNameChange,
  onEditionChange,
  onBasicsTouched,
}: BasicsStepProps) {
  return (
    <section
      aria-labelledby="wizard-step-basics-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-basics-heading">Basics</h2>
      <CharacterBasicsFields
        name={name}
        editionId={editionId}
        onNameChange={onNameChange}
        onEditionChange={onEditionChange}
        onBasicsTouched={onBasicsTouched}
      />
    </section>
  )
}
