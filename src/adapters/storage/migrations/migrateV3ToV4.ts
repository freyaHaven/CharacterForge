import type { Character } from '../../domain/types'
import type { StoredCharacterV3, StoredCharacterV4 } from '../storedCharacter'

/**
 * Adds `background: null` to every v3 character while preserving all other fields.
 */
export function migrateV3ToV4(envelope: unknown): StoredCharacterV4 {
  const v3 = envelope as StoredCharacterV3

  const character: Character = {
    ...v3.character,
    background: null,
  }

  return {
    schemaVersion: 4,
    character,
  }
}
