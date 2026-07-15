import type { StoredCharacterV2, StoredCharacterV3 } from '../storedCharacter'

/**
 * Adds `class: null` to every v2 character while preserving all other fields.
 */
export function migrateV2ToV3(envelope: unknown): StoredCharacterV3 {
  const v2 = envelope as StoredCharacterV2

  return {
    schemaVersion: 3,
    character: {
      ...v2.character,
      class: null,
    },
  }
}
