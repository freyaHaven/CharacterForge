import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { Character } from '../../domain/types'
import type { ClassSelection } from '../../domain/class/types'
import {
  isClassDraftIncomplete,
  type ClassSelectionDraft,
} from '../../features/class/classSelectionDraft'
import { useClassStepValidation } from '../useClassStepValidation'

type UseClassEditorOptions = {
  character: Character
  setCharacter: Dispatch<SetStateAction<Character>>
  classCatalog: ClassCatalog
  onDraftChange?: () => void
}

export function useClassEditor({
  character,
  setCharacter,
  classCatalog,
  onDraftChange,
}: UseClassEditorOptions) {
  const [classDraft, setClassDraft] = useState<ClassSelectionDraft | null>(null)

  const notifyDraftChange = useCallback(() => {
    onDraftChange?.()
  }, [onDraftChange])

  const resetClassDraft = useCallback(() => {
    setClassDraft(null)
  }, [])

  const { classDraftValidation, committedClassValid } = useClassStepValidation(
    classCatalog,
    character.editionId,
    character.class,
    classDraft,
  )

  const classDraftIncomplete = isClassDraftIncomplete(
    classDraft,
    character.class,
  )

  const commitClassSelection = useCallback(
    (classSelection: ClassSelection | null) => {
      setCharacter((current) => ({ ...current, class: classSelection }))
      notifyDraftChange()
    },
    [notifyDraftChange, setCharacter],
  )

  return {
    classDraft,
    setClassDraft,
    classDraftIncomplete,
    classDraftValidation,
    committedClassValid,
    resetClassDraft,
    commitClassSelection,
  }
}
