import type { StoredCharacterV1 } from '../storedCharacter'

/**
 * Wraps a legacy unversioned character object in a version-1 envelope.
 * Field preservation is identity — validation runs after migration.
 */
export function migrateV0ToV1(legacyCharacter: unknown): StoredCharacterV1 {
  return {
    schemaVersion: 1,
    character: legacyCharacter as StoredCharacterV1['character'],
  }
}
