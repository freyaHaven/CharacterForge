import type { CharacterRepository } from '../domain/ports/characterRepository'
import { isCharacter } from '../domain/character/isCharacter'
import type { Character } from '../domain/types'

const STORAGE_KEY_PREFIX = 'characterforge:character:'

function storageKey(id: string): string {
  return `${STORAGE_KEY_PREFIX}${id}`
}

/**
 * Parses stored JSON into a character.
 *
 * Returns `null` for malformed JSON or data that fails character shape
 * validation, so callers can treat unreadable storage like a missing character.
 */
function parseStoredCharacter(raw: string): Character | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    return isCharacter(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function createLocalStorageCharacterRepository(): CharacterRepository {
  return {
    async save(character: Character): Promise<void> {
      localStorage.setItem(storageKey(character.id), JSON.stringify(character))
    },

    async load(id: string): Promise<Character | null> {
      const raw = localStorage.getItem(storageKey(id))
      if (raw === null) {
        return null
      }

      return parseStoredCharacter(raw)
    },
  }
}
