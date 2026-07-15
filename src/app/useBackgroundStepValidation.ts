import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { EditionId } from '../domain/types'
import type { BackgroundSelection } from '../domain/background/types'
import {
  validateBackgroundDraft,
  type BackgroundSelectionDraft,
} from '../features/background/backgroundSelectionDraft'
import {
  validateBackgroundSelection,
  type BackgroundValidationResult,
} from '../rules/background/backgroundRules'

export function useBackgroundStepValidation(
  catalog: BackgroundCatalog,
  editionId: EditionId,
  committedSelection: BackgroundSelection | null,
  backgroundDraft: BackgroundSelectionDraft | null,
) {
  const [backgroundDraftValidation, setBackgroundDraftValidation] =
    useState<BackgroundValidationResult | null>(null)
  const [committedBackgroundValid, setCommittedBackgroundValid] =
    useState(false)

  useEffect(() => {
    if (backgroundDraft === null) {
      setBackgroundDraftValidation(null)
      return
    }

    let isActive = true

    void catalog.getBackground(backgroundDraft.backgroundId).then((definition) => {
      if (!isActive) {
        return
      }

      if (definition === null) {
        setBackgroundDraftValidation({
          ok: false,
          issues: [{ code: 'background-not-found' }],
        })
        return
      }

      setBackgroundDraftValidation(
        validateBackgroundDraft(backgroundDraft, editionId, definition),
      )
    })

    return () => {
      isActive = false
    }
  }, [backgroundDraft, catalog, editionId])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedBackgroundValid(false)
      return
    }

    let isActive = true

    void catalog
      .getBackground(committedSelection.backgroundId)
      .then((definition) => {
        if (!isActive) {
          return
        }

        setCommittedBackgroundValid(
          validateBackgroundSelection(
            committedSelection,
            editionId,
            definition,
          ).ok,
        )
      })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId])

  return { backgroundDraftValidation, committedBackgroundValid }
}
