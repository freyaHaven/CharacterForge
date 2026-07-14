import type { Character } from '../types'

/**
 * Persistence contract for characters.
 *
 * Implementations live in `src/adapters/`.
 *
 * TODO(storage): Before real character data ships, persist a versioned envelope
 * `{ schemaVersion, character }` and migrate older saves instead of rejecting
 * them. See `src/adapters/STORAGE.md`.
 */
export interface CharacterRepository {
  save(character: Character): Promise<void>

  /**
   * Returns the stored character, or `null` when:
   * - no value exists for the id
   * - the stored value is not valid JSON (malformed data)
   * - the parsed value does not match the expected character shape
   */
  load(id: string): Promise<Character | null>
}
