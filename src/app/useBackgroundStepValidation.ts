import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
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
  featCatalog?: FeatCatalog,
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

    void catalog.getBackground(backgroundDraft.backgroundId).then(async (definition) => {
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

      const originFeatDefinition =
        featCatalog !== undefined
          ? await featCatalog.getFeat(definition.originFeat.featId)
          : null

      if (!isActive) {
        return
      }

      setBackgroundDraftValidation(
        validateBackgroundDraft(backgroundDraft, editionId, definition, {
          originFeatDefinition,
        }),
      )
    })

    return () => {
      isActive = false
    }
  }, [backgroundDraft, catalog, editionId, featCatalog])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedBackgroundValid(false)
      return
    }

    let isActive = true

    void catalog
      .getBackground(committedSelection.backgroundId)
      .then(async (definition) => {
        if (!isActive) {
          return
        }

        const originFeatDefinition =
          definition !== null && featCatalog !== undefined
            ? await featCatalog.getFeat(definition.originFeat.featId)
            : null

        if (!isActive) {
          return
        }

        setCommittedBackgroundValid(
          validateBackgroundSelection(
            committedSelection,
            editionId,
            definition,
            { originFeatDefinition },
          ).ok,
        )
      })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId, featCatalog])

  return { backgroundDraftValidation, committedBackgroundValid }
}
