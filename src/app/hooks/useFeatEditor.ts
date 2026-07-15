import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { FeatCatalog } from '../../domain/ports/featCatalog'
import type { Character } from '../../domain/types'
import type { FeatSelection } from '../../domain/feat/types'
import {
  isFeatDraftIncomplete,
  type FeatSelectionDraft,
} from '../../features/feat/featSelectionDraft'
import { useFeatStepValidation } from '../useFeatStepValidation'

type UseFeatEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  featCatalog: FeatCatalog
  onDraftChange?: () => void
}

export function useFeatEditor({
  character,
  setCharacter,
  featCatalog,
  onDraftChange,
}: UseFeatEditorOptions) {
  const [featDraft, setFeatDraft] = useState<FeatSelectionDraft | null>(null)

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const resetFeatDraft = useCallback(() => {
    setFeatDraft(null)
  }, [])

  const { featDraftValidation, committedFeatValid } = useFeatStepValidation(
    featCatalog,
    character.editionId,
    character.feat,
    featDraft,
  )

  const featDraftIncomplete = isFeatDraftIncomplete(
    featDraft,
    character.feat,
  )

  const commitFeatSelection = useCallback(
    (feat: FeatSelection | null) => {
      setCharacter((current) => ({ ...current, feat }))
      notifyDraftChange()
    },
    [notifyDraftChange, setCharacter],
  )

  return {
    featDraft,
    setFeatDraft,
    featDraftIncomplete,
    featDraftValidation,
    committedFeatValid,
    resetFeatDraft,
    commitFeatSelection,
  }
}
