/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { Character } from '../../../domain/types'
import type { CharacterRepository } from '../../../domain/ports/characterRepository'
import { createEmptyClassSelectionDrafts } from '../../../features/class/classSelectionDraft'
import {
  clearClassEditorWorkflow,
  saveClassEditorWorkflow,
} from '../../session/classEditorWorkflowStorage'
import {
  clearEditorSession,
  getActiveCharacterId,
} from '../../session/editorSession'
import { useCharacterEditor } from '../useCharacterEditor'

const speciesCatalog = createBundledSpeciesCatalog()
const classCatalog = createBundledClassCatalog()
const backgroundCatalog = createBundledBackgroundCatalog()
const featCatalog = createBundledFeatCatalog()

function createStoredCharacter(overrides: Partial<Character> = {}): Character {
  return createDefaultCharacter({
    id: 'char-open-1',
    name: 'Freya',
    species: { speciesId: 'srd-2024:dwarf', choices: {} },
    ...overrides,
  })
}

describe('useCharacterEditor.openCharacter', () => {
  beforeEach(() => {
    clearEditorSession()
    clearClassEditorWorkflow('char-open-1')
  })

  it('loads a character and hydrates class workflow', async () => {
    const character = createStoredCharacter()
    const load = vi.fn().mockResolvedValue(character)
    const save = vi.fn().mockResolvedValue(undefined)
    const repository: CharacterRepository = { load, save, remove: vi.fn() }

    saveClassEditorWorkflow(character.id, {
      buildMode: 'single-class',
      classDrafts: createEmptyClassSelectionDrafts(),
      selectedInstanceId: null,
    })

    const { result } = renderHook(() =>
      useCharacterEditor({
        repository,
        speciesCatalog,
        classCatalog,
        backgroundCatalog,
        featCatalog,
        restoreFromStorage: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let opened = false
    await act(async () => {
      opened = await result.current.openCharacter(character.id)
    })

    expect(opened).toBe(true)
    expect(load).toHaveBeenCalledWith(character.id)
    expect(result.current.character.name).toBe('Freya')
    expect(result.current.character.id).toBe(character.id)
    expect(result.current.activeStepId).toBe('basics')
    expect(result.current.classEditor.buildMode).toBe('single-class')
    expect(getActiveCharacterId()).toBe(character.id)
  })

  it('returns false when the character is missing', async () => {
    const load = vi.fn().mockResolvedValue(null)
    const save = vi.fn().mockResolvedValue(undefined)
    const repository: CharacterRepository = { load, save, remove: vi.fn() }

    const { result } = renderHook(() =>
      useCharacterEditor({
        repository,
        speciesCatalog,
        classCatalog,
        backgroundCatalog,
        featCatalog,
        restoreFromStorage: false,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let opened = true
    await act(async () => {
      opened = await result.current.openCharacter('missing-id')
    })

    expect(opened).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})
