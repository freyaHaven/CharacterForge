import type { Character } from '../../domain/types'
import {
  CURRENT_SCHEMA_VERSION,
  type StoredCharacter,
} from '../storage/storedCharacter'

export function serializeCharacterFile(character: Character): string {
  const envelope: StoredCharacter = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    character,
  }

  return `${JSON.stringify(envelope, null, 2)}\n`
}
