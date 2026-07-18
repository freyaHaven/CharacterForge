import type {
  StoredCharacterV11,
  StoredCharacterV12,
} from '../storedCharacter'

/**
 * Adds empty `spellSourceStates` to every v11 character while preserving all
 * other fields.
 */
export function migrateV11ToV12(envelope: unknown): StoredCharacterV12 {
  const v11 = envelope as StoredCharacterV11

  return {
    schemaVersion: 12,
    character: {
      ...v11.character,
      spellSourceStates: [],
    },
  }
}
