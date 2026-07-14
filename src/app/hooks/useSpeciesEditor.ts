import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character, EditionId } from '../../domain/types'
import type { SpeciesSelection } from '../../domain/species/types'
import {
  isSpeciesDraftIncomplete,
  type SpeciesSelectionDraft,
} from '../../features/species/speciesSelectionDraft'
import { needsEditionChangeSpeciesConfirmation } from '../../rules/species/speciesRules'
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
  const [pendingEditionId, setPendingEditionId] = useState<EditionId | null>(
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

  const handleEditionChange = useCallback(
    async (nextEditionId: EditionId) => {
      if (nextEditionId === character.editionId) {
        return
      }

      const needsConfirmation = await needsEditionChangeSpeciesConfirmation(
        character.species,
        nextEditionId,
        (speciesId) => speciesCatalog.getSpecies(speciesId),
      )

      if (needsConfirmation) {
        setPendingEditionId(nextEditionId)
        return
      }

      setCharacter((current) => ({ ...current, editionId: nextEditionId }))
      resetSpeciesDraft()
      notifyDraftChange()
    },
    [
      character.editionId,
      character.species,
      notifyDraftChange,
      resetSpeciesDraft,
      setCharacter,
      speciesCatalog,
    ],
  )

  const confirmEditionChange = useCallback(() => {
    if (pendingEditionId === null) {
      return
    }

    setCharacter((current) => ({
      ...current,
      editionId: pendingEditionId,
      species: null,
    }))
    resetSpeciesDraft()
    setPendingEditionId(null)
    notifyDraftChange()
  }, [notifyDraftChange, pendingEditionId, resetSpeciesDraft, setCharacter])

  const cancelEditionChange = useCallback(() => {
    setPendingEditionId(null)
  }, [])

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
    pendingEditionId,
    speciesDraftIncomplete,
    speciesDraftValidation,
    committedSpeciesValid,
    resetSpeciesDraft,
    handleEditionChange,
    confirmEditionChange,
    cancelEditionChange,
    commitSpeciesSelection,
  }
}
