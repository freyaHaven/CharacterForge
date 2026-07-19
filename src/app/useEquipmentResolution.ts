import { useEffect, useState } from 'react'
import type { BackgroundCatalog } from '../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../domain/ports/classCatalog'
import type { EquipmentCatalog } from '../domain/ports/equipmentCatalog'
import type { Character } from '../domain/types'
import {
  resolveCharacterEquipment,
  type ResolvedEquipment,
} from '../rules/character/resolveCharacterEquipment'
import {
  validateResolvedEquipment,
  type EquipmentValidationResult,
} from '../rules/equipment/validateEquipmentSelections'

const EMPTY_RESOLVED: ResolvedEquipment = {
  sources: [],
  entries: [],
  inventory: [],
  mergedInventory: [],
  currency: { goldPieces: 0 },
  weightCarriedLb: 0,
}

export function useEquipmentResolution(
  classCatalog: ClassCatalog,
  backgroundCatalog: BackgroundCatalog,
  equipmentCatalog: EquipmentCatalog,
  character: Character,
): {
  resolvedEquipment: ResolvedEquipment
  equipmentValidation: EquipmentValidationResult | null
  committedEquipmentValid: boolean
} {
  const [resolvedEquipment, setResolvedEquipment] =
    useState<ResolvedEquipment>(EMPTY_RESOLVED)
  const [equipmentValidation, setEquipmentValidation] =
    useState<EquipmentValidationResult | null>(null)

  useEffect(() => {
    let isActive = true

    void resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    ).then((resolved) => {
      if (!isActive) {
        return
      }

      setResolvedEquipment(resolved)
      setEquipmentValidation(
        resolved.sources.length === 0
          ? null
          : validateResolvedEquipment(resolved),
      )
    })

    return () => {
      isActive = false
    }
  }, [
    backgroundCatalog,
    character,
    classCatalog,
    equipmentCatalog,
  ])

  const committedEquipmentValid =
    equipmentValidation === null || equipmentValidation.ok

  return {
    resolvedEquipment,
    equipmentValidation,
    committedEquipmentValid,
  }
}
