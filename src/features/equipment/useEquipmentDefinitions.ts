import { useEffect, useState } from 'react'
import type { EquipmentItemDefinition } from '../../domain/equipment/types'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import type { ResolvedInventoryItem } from '../../rules/character/resolveCharacterEquipment'

export function useEquipmentDefinitions(
  inventory: readonly ResolvedInventoryItem[],
  equipmentCatalog: EquipmentCatalog,
): Map<string, EquipmentItemDefinition> {
  const [definitionsById, setDefinitionsById] = useState(
    () => new Map<string, EquipmentItemDefinition>(),
  )

  useEffect(() => {
    let isActive = true

    void (async () => {
      const next = new Map<string, EquipmentItemDefinition>()
      await Promise.all(
        inventory.map(async (entry) => {
          const definition = await equipmentCatalog.getEquipment(entry.itemId)
          if (definition !== null) {
            next.set(entry.itemId, definition)
          }
        }),
      )
      if (isActive) {
        setDefinitionsById(next)
      }
    })()

    return () => {
      isActive = false
    }
  }, [equipmentCatalog, inventory])

  return definitionsById
}
