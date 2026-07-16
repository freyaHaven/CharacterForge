export const RECENT_CHARACTERS_STORAGE_KEY = 'characterforge:recent-characters'
export const MAX_RECENT_CHARACTERS = 6

export type RecentCharacterEntry = {
  id: string
  updatedAt: number
}

export type RecentCharactersState = {
  entries: RecentCharacterEntry[]
}

export type RecentCharactersStore = {
  list: () => RecentCharacterEntry[]
  touch: (id: string, updatedAt?: number) => void
  remove: (id: string) => void
  clear: () => void
}

function isRecentCharacterEntry(value: unknown): value is RecentCharacterEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const entry = value as Partial<RecentCharacterEntry>
  return typeof entry.id === 'string' && typeof entry.updatedAt === 'number'
}

function readState(): RecentCharactersState {
  if (typeof localStorage === 'undefined') {
    return { entries: [] }
  }

  const raw = localStorage.getItem(RECENT_CHARACTERS_STORAGE_KEY)
  if (raw === null) {
    return { entries: [] }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RecentCharactersState>
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter(isRecentCharacterEntry).slice(0, MAX_RECENT_CHARACTERS)
      : []
    return { entries }
  } catch {
    return { entries: [] }
  }
}

function writeState(state: RecentCharactersState): void {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(RECENT_CHARACTERS_STORAGE_KEY, JSON.stringify(state))
}

export function createRecentCharactersStore(
  now: () => number = Date.now,
): RecentCharactersStore {
  return {
    list() {
      return readState().entries
    },

    touch(id, updatedAt = now()) {
      const current = readState().entries
      const next: RecentCharacterEntry[] = [
        { id, updatedAt },
        ...current.filter((entry) => entry.id !== id),
      ].slice(0, MAX_RECENT_CHARACTERS)

      writeState({ entries: next })
    },

    remove(id) {
      const current = readState().entries
      writeState({
        entries: current.filter((entry) => entry.id !== id),
      })
    },

    clear() {
      if (typeof localStorage === 'undefined') {
        return
      }

      localStorage.removeItem(RECENT_CHARACTERS_STORAGE_KEY)
    },
  }
}

export const recentCharactersStore = createRecentCharactersStore()
