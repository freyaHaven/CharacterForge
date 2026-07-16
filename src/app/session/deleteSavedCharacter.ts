import type { CharacterRepository } from '../../domain/ports/characterRepository'
import { clearClassEditorWorkflow } from './classEditorWorkflowStorage'
import type { RecentCharactersStore } from './recentCharacters'

export type DeleteSavedCharacterOptions = {
  characterId: string
  repository: CharacterRepository
  recentStore: RecentCharactersStore
}

/**
 * Removes a saved character, its class-editor workflow state, and its recent entry.
 */
export async function deleteSavedCharacter(
  options: DeleteSavedCharacterOptions,
): Promise<void> {
  await options.repository.remove(options.characterId)
  clearClassEditorWorkflow(options.characterId)
  options.recentStore.remove(options.characterId)
}
