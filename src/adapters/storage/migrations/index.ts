import {
  CURRENT_SCHEMA_VERSION,
  isStoredCharacterEnvelope,
  type StoredCharacterV3,
} from '../storedCharacter'
import { detectStoredVersion } from './detectStoredVersion'
import { MIGRATIONS } from './registry'

export type MigrateToCurrentSchemaResult =
  | { ok: true; envelope: StoredCharacterV3 }
  | { ok: false; reason: 'malformed' | 'unsupported-version' }

/**
 * Normalises parsed JSON into the current stored envelope, running sequential
 * migrations when needed.
 */
export function migrateToCurrentSchema(
  parsed: unknown,
): MigrateToCurrentSchemaResult {
  const startVersion = detectStoredVersion(parsed)

  if (startVersion === 'malformed') {
    return { ok: false, reason: 'malformed' }
  }

  if (startVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, reason: 'unsupported-version' }
  }

  let envelope: unknown = parsed

  for (
    let version = startVersion;
    version < CURRENT_SCHEMA_VERSION;
    version += 1
  ) {
    const migrate = MIGRATIONS[version]

    if (migrate === undefined) {
      return { ok: false, reason: 'malformed' }
    }

    envelope = migrate(envelope)
  }

  if (!isStoredCharacterEnvelope(envelope, CURRENT_SCHEMA_VERSION)) {
    return { ok: false, reason: 'malformed' }
  }

  return { ok: true, envelope: envelope as StoredCharacterV3 }
}
