import type {
  StoredCharacterV13,
  StoredCharacterV14,
} from '../storedCharacter'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'

/**
 * Adds an empty equipment loadout. Owning inventory is unchanged; a later
 * reconcile step may infer armour / hands from resolved starting gear.
 */
export function migrateV13ToV14(envelope: unknown): StoredCharacterV14 {
  const v13 = envelope as StoredCharacterV13
  const equipment = v13.character.equipment

  return {
    schemaVersion: 14,
    character: {
      ...v13.character,
      equipment: {
        selections: equipment.selections,
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    },
  }
}
