// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import type { CharacterRepository } from '../../../domain/ports/characterRepository'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import { loadRecentCharacterSummaries } from '../loadRecentCharacterSummaries'
import {
  RECENT_CHARACTERS_STORAGE_KEY,
  createRecentCharactersStore,
} from '../recentCharacters'

describe('loadRecentCharacterSummaries', () => {
  beforeEach(() => {
    localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
  })

  it('resolves display summaries and prunes missing characters', async () => {
    const recentStore = createRecentCharactersStore(() => 1000)
    recentStore.touch('char-alive')
    recentStore.touch('char-missing')

    const alive = createDefaultCharacter({
      id: 'char-alive',
      name: 'Freya',
      species: { speciesId: 'srd-2024:dwarf', choices: {} },
      ...withSingleClassInstance(
        createTestFighterClassInstance({ level: 3 }),
      ),
    })

    const load = vi.fn(async (id: string) => {
      if (id === 'char-alive') {
        return alive
      }
      return null
    })
    const repository: CharacterRepository = {
      load,
      save: vi.fn(),
      remove: vi.fn(),
    }

    const summaries = await loadRecentCharacterSummaries({
      recentStore,
      repository,
      speciesCatalog: createBundledSpeciesCatalog(),
      classCatalog: createBundledClassCatalog(),
    })

    expect(summaries).toEqual([
      {
        id: 'char-alive',
        name: 'Freya',
        speciesName: 'Dwarf',
        classes: [{ className: 'Fighter', level: 3 }],
        updatedAt: 1000,
      },
    ])
    expect(recentStore.list().map((entry) => entry.id)).toEqual(['char-alive'])
  })
})
