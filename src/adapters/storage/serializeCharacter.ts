import type { Character } from '../../domain/types'
import {
  CURRENT_SCHEMA_VERSION,
  type StoredCharacter,
} from './storedCharacter'

export function serializeCharacter(character: Character): string {
  const envelope: StoredCharacter = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    character,
  }

  return JSON.stringify(envelope)
}
