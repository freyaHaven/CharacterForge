// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  MAX_RECENT_CHARACTERS,
  RECENT_CHARACTERS_STORAGE_KEY,
  createRecentCharactersStore,
} from '../recentCharacters'

describe('recentCharactersStore', () => {
  beforeEach(() => {
    localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
  })

  it('starts empty', () => {
    const store = createRecentCharactersStore(() => 1000)
    expect(store.list()).toEqual([])
  })

  it('touches an id to the front of the list', () => {
    const store = createRecentCharactersStore(() => 1000)
    store.touch('char-a')
    store.touch('char-b')

    expect(store.list()).toEqual([
      { id: 'char-b', updatedAt: 1000 },
      { id: 'char-a', updatedAt: 1000 },
    ])
  })

  it('moves an existing id to the front with a new timestamp', () => {
    let now = 1000
    const store = createRecentCharactersStore(() => now)

    store.touch('char-a')
    store.touch('char-b')
    now = 2000
    store.touch('char-a')

    expect(store.list()).toEqual([
      { id: 'char-a', updatedAt: 2000 },
      { id: 'char-b', updatedAt: 1000 },
    ])
  })

  it('caps the list at six entries and drops the oldest', () => {
    let now = 0
    const store = createRecentCharactersStore(() => {
      now += 1
      return now
    })

    for (let index = 1; index <= MAX_RECENT_CHARACTERS + 1; index += 1) {
      store.touch(`char-${index}`)
    }

    const entries = store.list()
    expect(entries).toHaveLength(MAX_RECENT_CHARACTERS)
    expect(entries[0]?.id).toBe('char-7')
    expect(entries.map((entry) => entry.id)).not.toContain('char-1')
  })

  it('removes an entry by id', () => {
    const store = createRecentCharactersStore(() => 1000)
    store.touch('char-a')
    store.touch('char-b')
    store.remove('char-a')

    expect(store.list()).toEqual([{ id: 'char-b', updatedAt: 1000 }])
  })

  it('ignores malformed stored data', () => {
    localStorage.setItem(RECENT_CHARACTERS_STORAGE_KEY, '{not-json')
    const store = createRecentCharactersStore(() => 1000)
    expect(store.list()).toEqual([])
  })
})
