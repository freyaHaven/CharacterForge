import { useEffect, useState } from 'react'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { EditionId } from '../domain/types'
import type { SpeciesSelection } from '../domain/species/types'
import type { FeatDefinition } from '../domain/feat/types'
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
  options?: {
    featCatalog?: FeatCatalog
    takenFeatIds?: readonly string[]
  },
) {
  const [speciesDraftValidation, setSpeciesDraftValidation] =
    useState<SpeciesValidationResult | null>(null)
  const [committedSpeciesValid, setCommittedSpeciesValid] = useState(false)
  const [featById, setFeatById] = useState<Map<string, FeatDefinition>>(
    () => new Map(),
  )

  useEffect(() => {
    if (options?.featCatalog === undefined) {
      setFeatById(new Map())
      return
    }

    let isActive = true

    void options.featCatalog.listFeats(editionId).then((feats) => {
      if (!isActive) {
        return
      }

      setFeatById(new Map(feats.map((feat) => [feat.id, feat])))
    })

    return () => {
      isActive = false
    }
  }, [editionId, options?.featCatalog])

  const validationOptions = {
    featById,
    takenFeatIds: options?.takenFeatIds,
  }

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
          validationOptions,
        ),
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, editionId, featById, options?.takenFeatIds, speciesDraft])

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
        validateSpeciesSelection(
          committedSelection,
          editionId,
          definition,
          validationOptions,
        ).ok,
      )
    })

    return () => {
      isActive = false
    }
  }, [catalog, committedSelection, editionId, featById, options?.takenFeatIds])

  return { speciesDraftValidation, committedSpeciesValid }
}
