// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { CharacterRepository } from '../../../domain/ports/characterRepository'
import {
  clearClassEditorWorkflow,
  loadClassEditorWorkflow,
  saveClassEditorWorkflow,
} from '../classEditorWorkflowStorage'
import { createEmptyClassSelectionDrafts } from '../../../features/class/classSelectionDraft'
import { deleteSavedCharacter } from '../deleteSavedCharacter'
import {
  RECENT_CHARACTERS_STORAGE_KEY,
  createRecentCharactersStore,
} from '../recentCharacters'

describe('deleteSavedCharacter', () => {
  beforeEach(() => {
    localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
    clearClassEditorWorkflow('char-delete-1')
  })

  it('removes character storage, workflow state, and the recent entry', async () => {
    const character = createDefaultCharacter({ id: 'char-delete-1' })
    const remove = vi.fn().mockResolvedValue(undefined)
    const repository: CharacterRepository = {
      save: vi.fn(),
      load: vi.fn(),
      remove,
    }
    const recentStore = createRecentCharactersStore(() => 1000)
    recentStore.touch(character.id)
    recentStore.touch('char-keep')

    saveClassEditorWorkflow(character.id, {
      buildMode: 'single-class',
      classDrafts: createEmptyClassSelectionDrafts(),
      selectedInstanceId: null,
    })

    await deleteSavedCharacter({
      characterId: character.id,
      repository,
      recentStore,
    })

    expect(remove).toHaveBeenCalledWith(character.id)
    expect(loadClassEditorWorkflow(character.id)).toBeNull()
    expect(recentStore.list().map((entry) => entry.id)).toEqual(['char-keep'])
  })
})
