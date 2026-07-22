import type {
  StoredCharacterV15,
  StoredCharacterV16,
} from '../storedCharacter'
import { EMPTY_CHARACTER_INVENTORY } from '../../../domain/equipment/types'

/**
 * Adds an empty persisted inventory. Starting equipment is seeded lazily once
 * catalogs resolve and selections are complete (see seedCharacterInventory).
 */
export function migrateV15ToV16(envelope: unknown): StoredCharacterV16 {
  const v15 = envelope as StoredCharacterV15

  return {
    schemaVersion: 16,
    character: {
      ...v15.character,
      equipment: {
        selections: v15.character.equipment.selections,
        loadout: v15.character.equipment.loadout,
        inventory: EMPTY_CHARACTER_INVENTORY,
      },
    },
  }
}
