import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character, EditionId } from '../../domain/types'
import { needsEditionChangeBackgroundConfirmation } from '../../rules/background/backgroundRules'
import {
  EMPTY_CLASS_STATE,
  getCommittedClassSelection,
} from '../../domain/character/characterClassSelection'
import { needsEditionChangeClassConfirmation } from '../../rules/class/classRules'
import { needsEditionChangeSpeciesConfirmation } from '../../rules/species/speciesRules'

export type PendingEditionChange = {
  nextEditionId: EditionId
  clearsSpecies: boolean
  clearsClass: boolean
  clearsBackground: boolean
}

type UseEditionChangeOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
  backgroundCatalog: BackgroundCatalog
  resetSpeciesDraft: () => void
  resetClassDraft: () => void
  resetBackgroundDraft: () => void
  onDraftChange?: () => void
}

export function useEditionChange({
  character,
  setCharacter,
  speciesCatalog,
  classCatalog,
  backgroundCatalog,
  resetSpeciesDraft,
  resetClassDraft,
  resetBackgroundDraft,
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

      const [clearsSpecies, clearsClass, clearsBackground] = await Promise.all([
        needsEditionChangeSpeciesConfirmation(
          character.species,
          nextEditionId,
          (speciesId) => speciesCatalog.getSpecies(speciesId),
        ),
        needsEditionChangeClassConfirmation(
          getCommittedClassSelection(character),
          nextEditionId,
          (classId) => classCatalog.getClass(classId),
        ),
        needsEditionChangeBackgroundConfirmation(
          character.background,
          nextEditionId,
          (backgroundId) => backgroundCatalog.getBackground(backgroundId),
        ),
      ])

      if (clearsSpecies || clearsClass || clearsBackground) {
        setPendingEditionChange({
          nextEditionId,
          clearsSpecies,
          clearsClass,
          clearsBackground,
        })
        return
      }

      setCharacter((current) => ({ ...current, editionId: nextEditionId }))
      resetSpeciesDraft()
      resetClassDraft()
      resetBackgroundDraft()
      notifyDraftChange()
    },
    [
      backgroundCatalog,
      character,
      character.editionId,
      classCatalog,
      notifyDraftChange,
      resetBackgroundDraft,
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
      ...(pendingEditionChange.clearsClass ? EMPTY_CLASS_STATE : {}),
      background: pendingEditionChange.clearsBackground
        ? null
        : current.background,
    }))
    resetSpeciesDraft()
    resetClassDraft()
    resetBackgroundDraft()
    setPendingEditionChange(null)
    notifyDraftChange()
  }, [
    notifyDraftChange,
    pendingEditionChange,
    resetBackgroundDraft,
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
