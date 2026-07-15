import type { Character } from '../types'

export type CharacterFileParseFailureReason =
  | 'malformed'
  | 'unsupported-version'
  | 'invalid-character'

export type CharacterFileParseResult =
  | { ok: true; character: Character }
  | { ok: false; reason: CharacterFileParseFailureReason }

/**
 * Explicit import/export contract for Character Forge project files.
 * Implementations live in `src/adapters/characterFile/`.
 */
export interface CharacterFileAdapter {
  serialize(character: Character): string
  parse(content: string): CharacterFileParseResult
}
