import type { StoredCharacterV1, StoredCharacterV2 } from '../storedCharacter'

/**
 * Adds `species: null` to every v1 character while preserving all other fields.
 */
export function migrateV1ToV2(envelope: unknown): StoredCharacterV2 {
  const v1 = envelope as StoredCharacterV1

  return {
    schemaVersion: 2,
    character: {
      ...v1.character,
      species: null,
    },
  }
}
