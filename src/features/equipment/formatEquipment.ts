import type { EquipmentSourceKindLabel } from '../../domain/equipment/types'

export function formatInventoryLine(item: {
  name: string
  quantity: number
}): string {
  if (item.quantity === 1) {
    return item.name
  }

  return `${item.name} × ${item.quantity}`
}

export function formatGoldPieces(goldPieces: number): string {
  return `${goldPieces} GP`
}

export function getSourceKindBadgeLabel(
  kind: EquipmentSourceKindLabel,
): string {
  return kind
}
