import type { Character } from '../../domain/types'
import {
  CURRENT_SCHEMA_VERSION,
  type StoredCharacterV2,
} from './storedCharacter'

export function serializeCharacter(character: Character): string {
  const envelope: StoredCharacterV2 = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    character,
  }

  return JSON.stringify(envelope)
}
