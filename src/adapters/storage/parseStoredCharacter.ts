import { isCharacter } from '../../domain/character/isCharacter'
import { migrateToCurrentSchema } from './migrations'
import type { ParseStoredCharacterResult } from './storedCharacter'

export function parseStoredCharacter(raw: string): ParseStoredCharacterResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const migration = migrateToCurrentSchema(parsed)

  if (!migration.ok) {
    return { ok: false, reason: migration.reason }
  }

  if (!isCharacter(migration.envelope.character)) {
    return { ok: false, reason: 'invalid-character' }
  }

  return { ok: true, character: migration.envelope.character }
}
