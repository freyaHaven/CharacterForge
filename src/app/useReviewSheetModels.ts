import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { ClassDefinition } from '../domain/class/types'
import { createDefaultCharacter } from '../domain/character/defaults'
import type { Character } from '../domain/types'
import {
  buildReviewSheetModels,
  type ReviewSheetModels,
} from './buildReviewSheetModels'

const EMPTY_MODELS: ReviewSheetModels = buildReviewSheetModels({
  character: createDefaultCharacter(),
  speciesDefinition: null,
  backgroundDefinition: null,
  featDefinition: null,
  classDefinitions: new Map(),
})

export function useReviewSheetModels(
  character: Character,
  speciesCatalog: SpeciesCatalog,
  classCatalog: ClassCatalog,
  backgroundCatalog: BackgroundCatalog,
  featCatalog: FeatCatalog,
): ReviewSheetModels {
  const [models, setModels] = useState<ReviewSheetModels>(EMPTY_MODELS)

  useEffect(() => {
    let isActive = true

    void (async () => {
      const speciesDefinition =
        character.species !== null
          ? await speciesCatalog.getSpecies(character.species.speciesId)
          : null
      const backgroundDefinition =
        character.background !== null
          ? await backgroundCatalog.getBackground(
              character.background.backgroundId,
            )
          : null
      const featDefinition =
        character.feat !== null
          ? await featCatalog.getFeat(character.feat.featId)
          : null
      const originFeatDefinition =
        featDefinition === null && backgroundDefinition !== null
          ? await featCatalog.getFeat(backgroundDefinition.originFeat.featId)
          : null

      const classDefinitions = new Map<string, ClassDefinition>()
      await Promise.all(
        character.classes.map(async (instance) => {
          const definition = await classCatalog.getClass(instance.classId)
          if (definition !== null) {
            classDefinitions.set(instance.classId, definition)
          }
        }),
      )

      if (!isActive) {
        return
      }

      setModels(
        buildReviewSheetModels({
          character,
          speciesDefinition,
          backgroundDefinition,
          featDefinition,
          originFeatDefinition,
          classDefinitions,
        }),
      )
    })()

    return () => {
      isActive = false
    }
  }, [
    backgroundCatalog,
    character,
    classCatalog,
    featCatalog,
    speciesCatalog,
  ])

  return models
}
