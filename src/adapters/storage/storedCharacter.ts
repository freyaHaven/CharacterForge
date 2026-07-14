import type { Character } from '../../domain/types'

export const CURRENT_SCHEMA_VERSION = 3

export type StoredCharacterV1 = {
  schemaVersion: 1
  character: Omit<Character, 'species' | 'class'>
}

export type StoredCharacterV2 = {
  schemaVersion: 2
  character: Omit<Character, 'class'>
}

export type StoredCharacterV3 = {
  schemaVersion: 3
  character: Character
}

export type StoredCharacter = StoredCharacterV3

export type ParseStoredCharacterResult =
  | { ok: true; character: Character }
  | {
      ok: false
      reason: 'malformed' | 'unsupported-version' | 'invalid-character'
    }

export function isStoredCharacterEnvelope(
  value: unknown,
  schemaVersion: number,
): value is StoredCharacterV1 | StoredCharacterV2 | StoredCharacterV3 {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    candidate.schemaVersion === schemaVersion &&
    typeof candidate.character === 'object' &&
    candidate.character !== null
  )
}
