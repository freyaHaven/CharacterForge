import type {
  StoredCharacterV15,
  StoredCharacterV16,
} from '../storedCharacter'

/**
 * Adds an empty persisted inventory. Starting equipment is seeded lazily once
 * catalogs resolve and selections are complete (see seedCharacterInventory).
 * Custom items arrive at v16→v17.
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
        inventory: {
          entries: [],
          currency: { goldPieces: 0 },
          seededFromStartingEquipment: false,
        },
      },
    },
  }
}
