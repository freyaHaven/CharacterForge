import { createDefaultCharacter } from '../../domain/character/defaults'

export const EDITOR_SESSION_STORAGE_KEY = 'characterforge:editor-session-active'
export const ACTIVE_CHARACTER_ID_KEY = 'characterforge:active-character-id'

export function isEditorSessionActive(): boolean {
  return sessionStorage.getItem(EDITOR_SESSION_STORAGE_KEY) === 'active'
}

export function activateEditorSession(characterId?: string): void {
  sessionStorage.setItem(EDITOR_SESSION_STORAGE_KEY, 'active')

  if (characterId !== undefined) {
    sessionStorage.setItem(ACTIVE_CHARACTER_ID_KEY, characterId)
  }
}

export function clearEditorSession(): void {
  sessionStorage.removeItem(EDITOR_SESSION_STORAGE_KEY)
  sessionStorage.removeItem(ACTIVE_CHARACTER_ID_KEY)
}

export function getActiveCharacterId(): string {
  return (
    sessionStorage.getItem(ACTIVE_CHARACTER_ID_KEY) ??
    createDefaultCharacter().id
  )
}

export function setActiveCharacterId(characterId: string): void {
  sessionStorage.setItem(ACTIVE_CHARACTER_ID_KEY, characterId)
}
