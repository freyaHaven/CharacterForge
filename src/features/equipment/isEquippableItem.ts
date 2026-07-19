import type { EquipmentItemDefinition } from '../../domain/equipment/types'

export function isEquippableItem(
  definition: EquipmentItemDefinition | undefined,
): boolean {
  if (definition === undefined) {
    return false
  }

  return (
    definition.category === 'armor' ||
    definition.category === 'shield' ||
    (definition.category === 'weapon' && definition.handUsage !== undefined)
  )
}
