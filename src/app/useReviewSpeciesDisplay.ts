import { useEffect, useState } from 'react'
import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { EditionId } from '../domain/types'
import type { SpeciesSelection } from '../domain/species/types'
import type { SpeciesSelectionDraft } from '../features/species/speciesSelectionDraft'
import type { SpeciesReviewDisplay } from './reviewSummary'

const EMPTY_DISPLAY: SpeciesReviewDisplay = {
  speciesName: null,
  ancestryLabel: null,
}

export function useReviewSpeciesDisplay(
  catalog: SpeciesCatalog,
  editionId: EditionId,
  committedSelection: SpeciesSelection | null,
  speciesDraft: SpeciesSelectionDraft | null,
): SpeciesReviewDisplay {
  const [display, setDisplay] = useState<SpeciesReviewDisplay>(EMPTY_DISPLAY)

  useEffect(() => {
    const activeSelection =
      speciesDraft === null
        ? committedSelection
        : {
            speciesId: speciesDraft.speciesId,
            choices: speciesDraft.choices,
          }

    if (activeSelection === null) {
      setDisplay(EMPTY_DISPLAY)
      return
    }

    let isActive = true

    void catalog.getSpecies(activeSelection.speciesId).then((definition) => {
      if (!isActive) {
        return
      }

      if (definition === null) {
        setDisplay({
          speciesName: null,
          ancestryLabel: null,
        })
        return
      }

      let ancestryLabel: string | null = null

      for (const choice of definition.choices) {
        const selectedOptionId = activeSelection.choices[choice.id]
        if (selectedOptionId === undefined) {
          continue
        }

        const option = choice.options.find(
          (candidate) => candidate.id === selectedOptionId,
        )
        if (option !== undefined) {
          ancestryLabel = option.label
        }
      }

      setDisplay({
        speciesName: definition.name,
        ancestryLabel,
      })
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, speciesDraft])

  return display
}
