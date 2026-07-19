import type { EditionId } from '../types'
import type { EquipmentItemDefinition } from '../equipment/types'

export interface EquipmentCatalog {
  getEquipment(equipmentId: string): Promise<EquipmentItemDefinition | null>
  listEquipment(editionId: EditionId): Promise<EquipmentItemDefinition[]>
}
