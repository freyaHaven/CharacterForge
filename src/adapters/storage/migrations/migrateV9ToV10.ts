import type {
  StoredCharacterV9,
  StoredCharacterV10,
} from '../storedCharacter'

/**
 * Adds `feat: null` to every v9 character while preserving all other fields.
 */
export function migrateV9ToV10(envelope: unknown): StoredCharacterV10 {
  const v9 = envelope as StoredCharacterV9

  return {
    schemaVersion: 10,
    character: {
      ...v9.character,
      feat: null,
    } as StoredCharacterV10['character'],
  }
}
