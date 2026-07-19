import type { EquipmentCatalog } from '../domain/ports/equipmentCatalog'
import { getBundledContentRegistry } from '../content/registry/bundledContent'

/**
 * EquipmentCatalog adapter over the Content Registry.
 */
export function createBundledEquipmentCatalog(
  registry = getBundledContentRegistry(),
): EquipmentCatalog {
  return {
    async getEquipment(equipmentId) {
      return registry.getEquipment(equipmentId)
    },
    async listEquipment(editionId) {
      return registry.listEquipment(editionId)
    },
  }
}
