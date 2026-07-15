import { useEffect, useState } from 'react'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { EditionId } from '../domain/types'
import type { FeatSelection } from '../domain/feat/types'
import type { FeatSelectionDraft } from '../features/feat/featSelectionDraft'
import type { FeatReviewDisplay } from './reviewSummary'

const EMPTY_DISPLAY: FeatReviewDisplay = {
  featName: null,
}

export function useReviewFeatDisplay(
  catalog: FeatCatalog,
  editionId: EditionId,
  committedSelection: FeatSelection | null,
  featDraft: FeatSelectionDraft | null,
): FeatReviewDisplay {
  const [display, setDisplay] = useState<FeatReviewDisplay>(EMPTY_DISPLAY)

  useEffect(() => {
    const activeFeatId =
      featDraft?.featId ?? committedSelection?.featId ?? null

    if (activeFeatId === null) {
      setDisplay(EMPTY_DISPLAY)
      return
    }

    let isActive = true

    void catalog.getFeat(activeFeatId).then((definition) => {
      if (!isActive) {
        return
      }

      setDisplay({
        featName: definition?.name ?? null,
      })
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId, featDraft])

  return display
}
