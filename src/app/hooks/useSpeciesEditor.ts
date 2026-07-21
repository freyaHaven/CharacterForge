import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../../domain/ports/speciesCatalog'
import type { Character } from '../../domain/types'
import type { SpeciesSelection } from '../../domain/species/types'
import {
  isSpeciesDraftIncomplete,
  type SpeciesSelectionDraft,
} from '../../features/species/speciesSelectionDraft'
import { useSpeciesStepValidation } from '../useSpeciesStepValidation'
import { collectClassFeatGrantIds } from '../../rules/character/resolveCharacterFeatGrants'

type UseSpeciesEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  speciesCatalog: SpeciesCatalog
  featCatalog?: FeatCatalog
  backgroundCatalog?: BackgroundCatalog
  onDraftChange?: () => void
}

export function useSpeciesEditor({
  character,
  setCharacter,
  speciesCatalog,
  featCatalog,
  backgroundCatalog,
  onDraftChange,
}: UseSpeciesEditorOptions) {
  const [speciesDraft, setSpeciesDraft] = useState<SpeciesSelectionDraft | null>(
    null,
  )
  const [takenFeatIds, setTakenFeatIds] = useState<string[]>([])

  useEffect(() => {
    let isActive = true

    void (async () => {
      const ids: string[] = []
      if (character.feat !== null) {
        ids.push(character.feat.featId)
      }
      for (const instance of character.classes) {
        ids.push(...collectClassFeatGrantIds(instance.choices))
      }
      if (character.background !== null && backgroundCatalog !== undefined) {
        const background = await backgroundCatalog.getBackground(
          character.background.backgroundId,
        )
        if (background !== null) {
          ids.push(background.originFeat.featId)
        }
      }
      if (isActive) {
        setTakenFeatIds(ids)
      }
    })()

    return () => {
      isActive = false
    }
  }, [
    backgroundCatalog,
    character.background,
    character.classes,
    character.feat,
  ])

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
      { featCatalog, takenFeatIds },
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
    takenFeatIds,
  }
}
