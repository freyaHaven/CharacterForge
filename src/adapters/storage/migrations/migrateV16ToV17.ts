import type {
  StoredCharacterV16,
  StoredCharacterV17,
} from '../storedCharacter'

/**
 * Adds `customItems` map for player-authored inventory definitions.
 * Existing entries gain no required fields; optional `catalogSnapshot` is
 * allowed by validators when present.
 */
export function migrateV16ToV17(envelope: unknown): StoredCharacterV17 {
  const v16 = envelope as StoredCharacterV16
  const inventory = v16.character.equipment.inventory

  return {
    schemaVersion: 17,
    character: {
      ...v16.character,
      equipment: {
        ...v16.character.equipment,
        inventory: {
          entries: inventory.entries,
          currency: inventory.currency,
          seededFromStartingEquipment: inventory.seededFromStartingEquipment,
          customItems:
            inventory.customItems !== undefined ? inventory.customItems : {},
        },
      },
    },
  }
}
