import type { CharacterRepository } from '../domain/ports/characterRepository'
import type { RecentCharactersStore } from '../app/session/recentCharacters'

/**
 * Decorates a CharacterRepository so every successful save touches the recent list.
 */
export function createRecentTrackingRepository(
  repository: CharacterRepository,
  recentStore: RecentCharactersStore,
): CharacterRepository {
  return {
    async save(character) {
      await repository.save(character)
      recentStore.touch(character.id)
    },

    async load(id) {
      return repository.load(id)
    },
  }
}
