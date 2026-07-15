import { createDefaultCharacterDetails } from '../../../domain/character/details'
import type { StoredCharacterV6, StoredCharacterV7 } from '../storedCharacter'

/**
 * Adds optional character details to stored characters.
 */
export function migrateV6ToV7(envelope: unknown): StoredCharacterV7 {
  const v6 = envelope as StoredCharacterV6

  return {
    schemaVersion: 7,
    character: {
      ...v6.character,
      details: createDefaultCharacterDetails(),
    },
  }
}
