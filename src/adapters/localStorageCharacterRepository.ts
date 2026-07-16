import type { CharacterRepository } from '../domain/ports/characterRepository'
import { parseStoredCharacter } from './storage/parseStoredCharacter'
import { serializeCharacter } from './storage/serializeCharacter'

const STORAGE_KEY_PREFIX = 'characterforge:character:'

function storageKey(id: string): string {
  return `${STORAGE_KEY_PREFIX}${id}`
}

export function createLocalStorageCharacterRepository(): CharacterRepository {
  return {
    async save(character) {
      localStorage.setItem(storageKey(character.id), serializeCharacter(character))
    },

    async load(id) {
      const raw = localStorage.getItem(storageKey(id))
      if (raw === null) {
        return null
      }

      const result = parseStoredCharacter(raw)
      return result.ok ? result.character : null
    },

    async remove(id) {
      localStorage.removeItem(storageKey(id))
    },
  }
}
