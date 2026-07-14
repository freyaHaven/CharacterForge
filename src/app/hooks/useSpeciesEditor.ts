import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { SpeciesSelection } from '../../domain/species/types'
import {
  isSpeciesDraftIncomplete,
  type SpeciesSelectionDraft,
} from '../../features/species/speciesSelectionDraft'
import { useSpeciesStepValidation } from '../useSpeciesStepValidation'

type UseSpeciesEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  speciesCatalog: SpeciesCatalog
  onDraftChange?: () => void
}

export function useSpeciesEditor({
  character,
  setCharacter,
  speciesCatalog,
  onDraftChange,
}: UseSpeciesEditorOptions) {
  const [speciesDraft, setSpeciesDraft] = useState<SpeciesSelectionDraft | null>(
    null,
  )

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const resetSpeciesDraft = useCallback(() => {
    setSpeciesDraft(null)
  }, [])

  const { speciesDraftValidation, committedSpeciesValid } =
    useSpeciesStepValidation(
      speciesCatalog,
      character.editionId,
      character.species,
      speciesDraft,
    )

  const speciesDraftIncomplete = isSpeciesDraftIncomplete(
    speciesDraft,
    character.species,
  )

  const commitSpeciesSelection = useCallback(
    (species: SpeciesSelection | null) => {
      setCharacter((current) => ({ ...current, species }))
      notifyDraftChange()
    },
    [notifyDraftChange, setCharacter],
  )

  return {
    speciesDraft,
    setSpeciesDraft,
    speciesDraftIncomplete,
    speciesDraftValidation,
    committedSpeciesValid,
    resetSpeciesDraft,
    commitSpeciesSelection,
  }
}
