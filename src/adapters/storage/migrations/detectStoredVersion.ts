export type DetectStoredVersionResult = number | 'malformed'

/**
 * Returns the stored schema version, or `0` for legacy unversioned character
 * objects written at the JSON root.
 */
export function detectStoredVersion(parsed: unknown): DetectStoredVersionResult {
  if (typeof parsed !== 'object' || parsed === null) {
    return 'malformed'
  }

  const candidate = parsed as Record<string, unknown>

  if (typeof candidate.schemaVersion === 'number') {
    return candidate.schemaVersion
  }

  if (typeof candidate.id === 'string' && candidate.id.length > 0) {
    return 0
  }

  return 'malformed'
}
