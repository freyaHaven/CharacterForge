import { useEffect, useState } from 'react'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { EditionId } from '../domain/types'
import type { ClassSelection } from '../domain/class/types'
import type { FeatDefinition } from '../domain/feat/types'
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
  featCatalog?: FeatCatalog,
  characterFeatId?: string | null,
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

    void Promise.all([
      catalog.getClass(classDraft.classId),
      featCatalog?.listFeats(editionId) ?? Promise.resolve([] as FeatDefinition[]),
    ]).then(([definition, feats]) => {
      if (!isActive) {
        return
      }

      const featById =
        featCatalog === undefined
          ? undefined
          : new Map(feats.map((feat) => [feat.id, feat]))

      setClassDraftValidation(
        validateClassSelection(
          draftToClassSelection(classDraft),
          editionId,
          definition,
          {
            featById,
            characterFeatId: characterFeatId ?? null,
          },
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, characterFeatId, classDraft, editionId, featCatalog])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedClassValid(false)
      return
    }

    let isActive = true

    void Promise.all([
      catalog.getClass(committedSelection.classId),
      featCatalog?.listFeats(editionId) ?? Promise.resolve([] as FeatDefinition[]),
    ]).then(([definition, feats]) => {
      if (!isActive) {
        return
      }

      const featById =
        featCatalog === undefined
          ? undefined
          : new Map(feats.map((feat) => [feat.id, feat]))

      setCommittedClassValid(
        validateClassSelection(committedSelection, editionId, definition, {
          featById,
          characterFeatId: characterFeatId ?? null,
        }).ok,
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, characterFeatId, committedSelection, editionId, featCatalog])

  return { classDraftValidation, committedClassValid }
}
