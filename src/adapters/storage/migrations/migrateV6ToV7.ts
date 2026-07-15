import { createDefaultCharacterDetails } from '../../../domain/character/details'
import type { Character } from '../../../domain/types'
import type { StoredCharacterV6, StoredCharacterV7 } from '../storedCharacter'

/**
 * Adds optional character details to stored characters.
 */
export function migrateV6ToV7(envelope: unknown): StoredCharacterV7 {
  const v6 = envelope as StoredCharacterV6

  const character: Character = {
    ...v6.character,
    details: createDefaultCharacterDetails(),
  }

  return {
    schemaVersion: 7,
    character,
  }
}
