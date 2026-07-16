// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultCharacter } from '../../domain/character/defaults'
import type { CharacterRepository } from '../../domain/ports/characterRepository'
import {
  RECENT_CHARACTERS_STORAGE_KEY,
  createRecentCharactersStore,
} from '../../app/session/recentCharacters'
import { createRecentTrackingRepository } from '../recentTrackingCharacterRepository'

describe('createRecentTrackingRepository', () => {
  beforeEach(() => {
    localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
  })

  it('touches the recent store after a successful save', async () => {
    const character = createDefaultCharacter({ id: 'char-tracked' })
    const save = vi.fn().mockResolvedValue(undefined)
    const load = vi.fn().mockResolvedValue(null)
    const inner: CharacterRepository = { save, load }
    const recentStore = createRecentCharactersStore(() => 42)
    const repository = createRecentTrackingRepository(inner, recentStore)

    await repository.save(character)

    expect(save).toHaveBeenCalledWith(character)
    expect(recentStore.list()).toEqual([{ id: 'char-tracked', updatedAt: 42 }])
  })

  it('does not touch recent when save rejects', async () => {
    const character = createDefaultCharacter({ id: 'char-fail' })
    const save = vi.fn().mockRejectedValue(new Error('save failed'))
    const load = vi.fn().mockResolvedValue(null)
    const inner: CharacterRepository = { save, load }
    const recentStore = createRecentCharactersStore(() => 42)
    const repository = createRecentTrackingRepository(inner, recentStore)

    await expect(repository.save(character)).rejects.toThrow('save failed')
    expect(recentStore.list()).toEqual([])
  })

  it('delegates load unchanged', async () => {
    const character = createDefaultCharacter({ id: 'char-load' })
    const save = vi.fn()
    const load = vi.fn().mockResolvedValue(character)
    const inner: CharacterRepository = { save, load }
    const recentStore = createRecentCharactersStore(() => 42)
    const repository = createRecentTrackingRepository(inner, recentStore)

    await expect(repository.load('char-load')).resolves.toBe(character)
    expect(load).toHaveBeenCalledWith('char-load')
    expect(recentStore.list()).toEqual([])
  })
})
