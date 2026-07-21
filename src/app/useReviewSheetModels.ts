import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { EquipmentCatalog } from '../domain/ports/equipmentCatalog'
import type { FeatCatalog } from '../domain/ports/featCatalog'
import type { SpeciesCatalog } from '../domain/ports/speciesCatalog'
import type { ClassDefinition } from '../domain/class/types'
import type { EquipmentItemDefinition } from '../domain/equipment/types'
import { getClassInstancesForHitPoints } from '../domain/character/classLevels'
import { createDefaultCharacter } from '../domain/character/defaults'
import type { Character } from '../domain/types'
import type { ClassSelectionDrafts } from '../features/class/classSelectionDraft'
import type { ResolvedEquipment } from '../rules/character/resolveCharacterEquipment'
import {
  buildReviewSheetModels,
  type ReviewSheetModels,
} from './buildReviewSheetModels'
import { resolveCharacterFeatGrants } from '../rules/character/resolveCharacterFeatGrants'
import type { FeatDefinition } from '../domain/feat/types'

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
  options?: {
    classDrafts?: ClassSelectionDrafts
    resolvedEquipment?: ResolvedEquipment
    equipmentCatalog?: EquipmentCatalog
  },
): ReviewSheetModels {
  const [models, setModels] = useState<ReviewSheetModels>(EMPTY_MODELS)
  const classDrafts = options?.classDrafts ?? {}
  const resolvedEquipment = options?.resolvedEquipment
  const equipmentCatalog = options?.equipmentCatalog

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

      const resolvedFeats = await resolveCharacterFeatGrants(character, {
        classCatalog,
        backgroundCatalog,
        featCatalog,
      })
      const featDefinitionsById = new Map<string, FeatDefinition>()
      await Promise.all(
        resolvedFeats.grants.map(async (grant) => {
          if (featDefinitionsById.has(grant.featId)) {
            return
          }
          const definition = await featCatalog.getFeat(grant.featId)
          if (definition !== null) {
            featDefinitionsById.set(grant.featId, definition)
          }
        }),
      )

      const hitPointClasses = getClassInstancesForHitPoints(
        character.classes,
        classDrafts,
      )

      const classDefinitions = new Map<string, ClassDefinition>()
      const classIds = new Set([
        ...character.classes.map((instance) => instance.classId),
        ...hitPointClasses.map((instance) => instance.classId),
      ])
      await Promise.all(
        [...classIds].map(async (classId) => {
          const definition = await classCatalog.getClass(classId)
          if (definition !== null) {
            classDefinitions.set(classId, definition)
          }
        }),
      )

      const equipmentDefinitionsById = new Map<string, EquipmentItemDefinition>()
      if (equipmentCatalog !== undefined && resolvedEquipment !== undefined) {
        await Promise.all(
          resolvedEquipment.inventory.map(async (entry) => {
            if (equipmentDefinitionsById.has(entry.itemId)) {
              return
            }
            const definition = await equipmentCatalog.getEquipment(entry.itemId)
            if (definition !== null) {
              equipmentDefinitionsById.set(entry.itemId, definition)
            }
          }),
        )
      }

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
          featGrants: resolvedFeats.grants,
          featDefinitionsById,
          classDefinitions,
          hitPointClasses,
          resolvedEquipment,
          equipmentDefinitionsById,
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
    classDrafts,
    equipmentCatalog,
    featCatalog,
    resolvedEquipment,
    speciesCatalog,
  ])

  return models
}
