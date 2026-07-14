import { EDITION_OPTIONS } from '../edition-picker/editionOptions'
import type { EditionId } from '../../domain/types'

type CharacterBasicsFieldsProps = {
  name: string
  editionId: EditionId
  onNameChange: (name: string) => void
  onEditionChange: (editionId: EditionId) => void
  onBasicsTouched?: () => void
}

export function CharacterBasicsFields({
  name,
  editionId,
  onNameChange,
  onEditionChange,
  onBasicsTouched,
}: CharacterBasicsFieldsProps) {
  function markTouched() {
    onBasicsTouched?.()
  }

  return (
    <div className="character-basics-fields">
      <label className="field">
        <span>Character name</span>
        <input
          type="text"
          value={name}
          onFocus={markTouched}
          onChange={(event) => {
            markTouched()
            onNameChange(event.target.value)
          }}
        />
      </label>

      <label className="field">
        <span>Rules edition</span>
        <select
          value={editionId}
          onFocus={markTouched}
          onChange={(event) => {
            markTouched()
            onEditionChange(event.target.value as EditionId)
          }}
        >
          {EDITION_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
