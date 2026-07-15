import type { CharacterFileParseResult } from '../../domain/ports/characterFile'
import { parseStoredCharacter } from '../storage/parseStoredCharacter'

export function parseCharacterFile(content: string): CharacterFileParseResult {
  return parseStoredCharacter(content)
}
