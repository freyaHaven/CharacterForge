import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { Character } from '../../domain/types'
import type { BackgroundSelection } from '../../domain/background/types'
import {
  isBackgroundDraftIncomplete,
  type BackgroundSelectionDraft,
} from '../../features/background/backgroundSelectionDraft'
import { useBackgroundStepValidation } from '../useBackgroundStepValidation'

type UseBackgroundEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  backgroundCatalog: BackgroundCatalog
  featCatalog?: FeatCatalog
  onDraftChange?: () => void
}

export function useBackgroundEditor({
  character,
  setCharacter,
  backgroundCatalog,
  featCatalog,
  onDraftChange,
}: UseBackgroundEditorOptions) {
  const [backgroundDraft, setBackgroundDraft] =
    useState<BackgroundSelectionDraft | null>(null)

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const resetBackgroundDraft = useCallback(() => {
    setBackgroundDraft(null)
  }, [])

  const { backgroundDraftValidation, committedBackgroundValid } =
    useBackgroundStepValidation(
      backgroundCatalog,
      character.editionId,
      character.background,
      backgroundDraft,
      featCatalog,
    )

  const backgroundDraftIncomplete = isBackgroundDraftIncomplete(
    backgroundDraft,
    character.background,
  )

  const commitBackgroundSelection = useCallback(
    (background: BackgroundSelection | null) => {
      setCharacter((current) => ({ ...current, background }))
      notifyDraftChange()
    },
    [notifyDraftChange, setCharacter],
  )

  return {
    backgroundDraft,
    setBackgroundDraft,
    backgroundDraftIncomplete,
    backgroundDraftValidation,
    committedBackgroundValid,
    resetBackgroundDraft,
    commitBackgroundSelection,
  }
}
