import type { CharacterFileParseFailureReason } from '../../domain/ports/characterFile'

export function formatCharacterFileError(
  reason: CharacterFileParseFailureReason,
): string {
  switch (reason) {
    case 'malformed':
      return 'This file could not be read. Check that it is valid Character Forge (.cforge) data.'
    case 'unsupported-version':
      return 'This character file was created with a newer version of Character Forge and cannot be imported yet.'
    case 'invalid-character':
      return 'This file is missing required character information or contains invalid data.'
  }
}
