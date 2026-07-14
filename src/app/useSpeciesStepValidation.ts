import { useEffect, useState } from 'react'
import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { EditionId } from '../domain/types'
import type { SpeciesSelection } from '../domain/species/types'
import {
  draftToSpeciesSelection,
  type SpeciesSelectionDraft,
} from '../features/species/speciesSelectionDraft'
import {
  validateSpeciesSelection,
  type SpeciesValidationResult,
} from '../rules/species/speciesRules'

export function useSpeciesStepValidation(
  catalog: SpeciesCatalog,
  editionId: EditionId,
  committedSelection: SpeciesSelection | null,
  speciesDraft: SpeciesSelectionDraft | null,
) {
  const [speciesDraftValidation, setSpeciesDraftValidation] =
    useState<SpeciesValidationResult | null>(null)
  const [committedSpeciesValid, setCommittedSpeciesValid] = useState(false)

  useEffect(() => {
    if (speciesDraft === null) {
      setSpeciesDraftValidation(null)
      return
    }

    let isActive = true

    void catalog.getSpecies(speciesDraft.speciesId).then((definition) => {
      if (!isActive) {
        return
      }

      setSpeciesDraftValidation(
        validateSpeciesSelection(
          draftToSpeciesSelection(speciesDraft),
          editionId,
          definition,
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId, speciesDraft])

  useEffect(() => {
    if (committedSelection === null) {
      setCommittedSpeciesValid(false)
      return
    }

    let isActive = true

    void catalog.getSpecies(committedSelection.speciesId).then((definition) => {
      if (!isActive) {
        return
      }

      setCommittedSpeciesValid(
        validateSpeciesSelection(committedSelection, editionId, definition).ok,
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId])

  return { speciesDraftValidation, committedSpeciesValid }
}
