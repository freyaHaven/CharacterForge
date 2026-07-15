import { migrateLegacyCharacterDetails } from '../../../domain/character/migrateCharacterDetails'
import type { StoredCharacterV7, StoredCharacterV8 } from '../storedCharacter'

/**
 * Restructures character details for the roleplay-focused layout and migrates
 * legacy v7 field names and free-text gender/pronoun values.
 */
export function migrateV7ToV8(envelope: unknown): StoredCharacterV8 {
  const v7 = envelope as StoredCharacterV7

  return {
    schemaVersion: 8,
    character: {
      ...v7.character,
      details: migrateLegacyCharacterDetails(v7.character.details),
    },
  }
}
