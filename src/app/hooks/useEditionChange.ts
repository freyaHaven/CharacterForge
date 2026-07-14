import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character, EditionId } from '../../domain/types'
import { needsEditionChangeClassConfirmation } from '../../rules/class/classRules'
import { needsEditionChangeSpeciesConfirmation } from '../../rules/species/speciesRules'

export type PendingEditionChange = {
  nextEditionId: EditionId
  clearsSpecies: boolean
  clearsClass: boolean
}

type UseEditionChangeOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
  resetSpeciesDraft: () => void
  resetClassDraft: () => void
  onDraftChange?: () => void
}

export function useEditionChange({
  character,
  setCharacter,
  speciesCatalog,
  classCatalog,
  resetSpeciesDraft,
  resetClassDraft,
  onDraftChange,
}: UseEditionChangeOptions) {
  const [pendingEditionChange, setPendingEditionChange] =
    useState<PendingEditionChange | null>(null)

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const handleEditionChange = useCallback(
    async (nextEditionId: EditionId) => {
      if (nextEditionId === character.editionId) {
        return
      }

      const [clearsSpecies, clearsClass] = await Promise.all([
        needsEditionChangeSpeciesConfirmation(
          character.species,
          nextEditionId,
          (speciesId) => speciesCatalog.getSpecies(speciesId),
        ),
        needsEditionChangeClassConfirmation(
          character.class,
          nextEditionId,
          (classId) => classCatalog.getClass(classId),
        ),
      ])

      if (clearsSpecies || clearsClass) {
        setPendingEditionChange({
          nextEditionId,
          clearsSpecies,
          clearsClass,
        })
        return
      }

      setCharacter((current) => ({ ...current, editionId: nextEditionId }))
      resetSpeciesDraft()
      resetClassDraft()
      notifyDraftChange()
    },
    [
      character.class,
      character.editionId,
      character.species,
      classCatalog,
      notifyDraftChange,
      resetClassDraft,
      resetSpeciesDraft,
      setCharacter,
      speciesCatalog,
    ],
  )

  const confirmEditionChange = useCallback(() => {
    if (pendingEditionChange === null) {
      return
    }

    setCharacter((current) => ({
      ...current,
      editionId: pendingEditionChange.nextEditionId,
      species: pendingEditionChange.clearsSpecies ? null : current.species,
      class: pendingEditionChange.clearsClass ? null : current.class,
    }))
    resetSpeciesDraft()
    resetClassDraft()
    setPendingEditionChange(null)
    notifyDraftChange()
  }, [
    notifyDraftChange,
    pendingEditionChange,
    resetClassDraft,
    resetSpeciesDraft,
    setCharacter,
  ])

  const cancelEditionChange = useCallback(() => {
    setPendingEditionChange(null)
  }, [])

  return {
    pendingEditionChange,
    handleEditionChange,
    confirmEditionChange,
    cancelEditionChange,
  }
}
