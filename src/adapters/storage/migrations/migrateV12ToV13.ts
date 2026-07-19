import type {
  StoredCharacterV12,
  StoredCharacterV13,
} from '../storedCharacter'

/**
 * Adds empty `equipment` selections to every v12 character while preserving all
 * other fields.
 */
export function migrateV12ToV13(envelope: unknown): StoredCharacterV13 {
  const v12 = envelope as StoredCharacterV12

  return {
    schemaVersion: 13,
    character: {
      ...v12.character,
      equipment: {
        selections: v12.character.equipment?.selections ?? [],
      },
    },
  }
}
