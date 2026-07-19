import type { EquipmentGrant } from '../types'
import { GOLD_PIECES_ITEM_ID } from '../types'

/** Convenience helper for package item lists. */
export function item(
  itemId: string,
  quantity = 1,
): EquipmentGrant {
  return { itemId, quantity }
}

export function gold(goldPieces: number): EquipmentGrant {
  return { itemId: GOLD_PIECES_ITEM_ID, quantity: goldPieces }
}
