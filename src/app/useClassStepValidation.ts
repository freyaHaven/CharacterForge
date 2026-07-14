import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { EditionId } from '../domain/types'
import type { ClassSelection } from '../domain/class/types'
import {
  draftToClassSelection,
  type ClassSelectionDraft,
} from '../features/class/classSelectionDraft'
import {
  validateClassSelection,
  type ClassValidationResult,
} from '../rules/class/classRules'

export function useClassStepValidation(
  catalog: ClassCatalog,
  editionId: EditionId,
  committedSelection: ClassSelection | null,
  classDraft: ClassSelectionDraft | null,
) {
  const [classDraftValidation, setClassDraftValidation] =
    useState<ClassValidationResult | null>(null)
  const [committedClassValid, setCommittedClassValid] = useState(false)

  useEffect(() => {
    if (classDraft === null) {
      setClassDraftValidation(null)
      return
    }

    let isActive = true

    void catalog.getClass(classDraft.classId).then((definition) => {
      if (!isActive) {
        return
      }

      setClassDraftValidation(
        validateClassSelection(
          draftToClassSelection(classDraft),
          editionId,
          definition,
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId, classDraft])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedClassValid(false)
      return
    }

    let isActive = true

    void catalog.getClass(committedSelection.classId).then((definition) => {
      if (!isActive) {
        return
      }

      setCommittedClassValid(
        validateClassSelection(committedSelection, editionId, definition).ok,
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId])

  return { classDraftValidation, committedClassValid }
}
