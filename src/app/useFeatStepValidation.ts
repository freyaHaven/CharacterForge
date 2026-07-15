import { useEffect, useState } from 'react'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { EditionId } from '../domain/types'
import type { FeatSelection } from '../domain/feat/types'
import {
  draftToFeatSelection,
  type FeatSelectionDraft,
} from '../features/feat/featSelectionDraft'
import {
  validateFeatSelection,
  type FeatValidationResult,
} from '../rules/feat/featRules'

export function useFeatStepValidation(
  catalog: FeatCatalog,
  editionId: EditionId,
  committedSelection: FeatSelection | null,
  featDraft: FeatSelectionDraft | null,
) {
  const [featDraftValidation, setFeatDraftValidation] =
    useState<FeatValidationResult | null>(null)
  const [committedFeatValid, setCommittedFeatValid] = useState(false)

  useEffect(() => {
    if (featDraft === null) {
      setFeatDraftValidation(null)
      return
    }

    let isActive = true

    void catalog.getFeat(featDraft.featId).then((definition) => {
      if (!isActive) {
        return
      }

      if (definition === null) {
        setFeatDraftValidation({
          ok: false,
          issues: [{ code: 'feat-not-found' }],
        })
        return
      }

      setFeatDraftValidation(
        validateFeatSelection(
          draftToFeatSelection(featDraft),
          editionId,
          definition,
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [featDraft, catalog, editionId])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedFeatValid(false)
      return
    }

    let isActive = true

    void catalog.getFeat(committedSelection.featId).then((definition) => {
      if (!isActive) {
        return
      }

      setCommittedFeatValid(
        validateFeatSelection(committedSelection, editionId, definition).ok,
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId])

  return { featDraftValidation, committedFeatValid }
}
