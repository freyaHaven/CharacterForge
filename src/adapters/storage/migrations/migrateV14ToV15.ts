import type {
  StoredCharacterV14,
  StoredCharacterV15,
} from '../storedCharacter'
import type { EquipmentSelection } from '../../../domain/equipment/types'

/**
 * Normalise equipment selection paths for nested starting-equipment trees.
 * Root selections get `path: []` when omitted.
 */
export function migrateV14ToV15(envelope: unknown): StoredCharacterV15 {
  const v14 = envelope as StoredCharacterV14
  const selections: EquipmentSelection[] = v14.character.equipment.selections.map(
    (selection) => ({
      ...selection,
      path: selection.path ?? [],
    }),
  )

  return {
    schemaVersion: 15,
    character: {
      ...v14.character,
      equipment: {
        ...v14.character.equipment,
        selections,
      },
    },
  }
}
