import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character, EditionId } from '../../domain/types'
import { needsEditionChangeBackgroundConfirmation } from '../../rules/background/backgroundRules'
import {
  EMPTY_CLASS_STATE,
  getCommittedClassSelection,
} from '../../domain/character/characterClassSelection'
import { needsEditionChangeClassConfirmation } from '../../rules/class/classRules'
import { needsEditionChangeFeatConfirmation } from '../../rules/feat/featRules'
import { needsEditionChangeSpeciesConfirmation } from '../../rules/species/speciesRules'

export type PendingEditionChange = {
  nextEditionId: EditionId
  clearsSpecies: boolean
  clearsClass: boolean
  clearsBackground: boolean
  clearsFeat: boolean
}

type UseEditionChangeOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  speciesCatalog: SpeciesCatalog
  classCatalog: ClassCatalog
  backgroundCatalog: BackgroundCatalog
  featCatalog: FeatCatalog
  resetSpeciesDraft: () => void
  resetClassDraft: () => void
  resetBackgroundDraft: () => void
  resetFeatDraft: () => void
  onDraftChange?: () => void
}

export function useEditionChange({
  character,
  setCharacter,
  speciesCatalog,
  classCatalog,
  backgroundCatalog,
  featCatalog,
  resetSpeciesDraft,
  resetClassDraft,
  resetBackgroundDraft,
  resetFeatDraft,
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

      const [clearsSpecies, clearsClass, clearsBackground, clearsFeat] =
        await Promise.all([
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
          needsEditionChangeFeatConfirmation(
            character.feat,
            nextEditionId,
            (featId) => featCatalog.getFeat(featId),
          ),
        ])

      if (clearsSpecies || clearsClass || clearsBackground || clearsFeat) {
        setPendingEditionChange({
          nextEditionId,
          clearsSpecies,
          clearsClass,
          clearsBackground,
          clearsFeat,
        })
        return
      }

      setCharacter((current) => ({ ...current, editionId: nextEditionId }))
      resetSpeciesDraft()
      resetClassDraft()
      resetBackgroundDraft()
      resetFeatDraft()
      notifyDraftChange()
    },
    [
      backgroundCatalog,
      character,
      character.editionId,
      classCatalog,
      featCatalog,
      notifyDraftChange,
      resetBackgroundDraft,
      resetClassDraft,
      resetFeatDraft,
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
      feat: pendingEditionChange.clearsFeat ? null : current.feat,
    }))
    resetSpeciesDraft()
    resetClassDraft()
    resetBackgroundDraft()
    resetFeatDraft()
    setPendingEditionChange(null)
    notifyDraftChange()
  }, [
    notifyDraftChange,
    pendingEditionChange,
    resetBackgroundDraft,
    resetClassDraft,
    resetFeatDraft,
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
