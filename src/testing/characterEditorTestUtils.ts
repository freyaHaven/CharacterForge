import type { UserEvent } from '@testing-library/user-event'
import type { Screen } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import {
  activateEditorSession,
  clearEditorSession,
} from '../app/session/editorSession'
import { recentCharactersStore } from '../app/session/recentCharacters'

export { activateEditorSession, clearEditorSession }

export function clearRecentCharacters() {
  recentCharactersStore.clear()
}

/** Seed before rendering App so Home can list the character. */
export function seedRecentCharacter(characterId: string) {
  recentCharactersStore.touch(characterId)
}

export async function waitForAppReady() {
  await waitFor(() => {
    expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
  })
}

export async function enterEditorFromLanding(user: UserEvent) {
  const createButton = screen.queryByRole('button', {
    name: /create new character/i,
  })

  if (createButton !== null) {
    await user.click(createButton)
  }
}

export async function openCharacterEditor(
  user: UserEvent,
  screenInstance: Screen = screen,
) {
  await waitForAppReady()

  if (
    screenInstance.queryByRole('button', { name: /create new character/i })
  ) {
    await enterEditorFromLanding(user)
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Opens a character from the Home Continue list.
 * Call after rendering App with the character already seeded via
 * `seedRecentCharacter` and load mocked.
 */
export async function openStoredCharacterEditor(
  user: UserEvent,
  character: { id: string; name: string },
  screenInstance: Screen = screen,
) {
  await waitForAppReady()

  await waitFor(() => {
    expect(
      screenInstance.getByRole('heading', { name: /^continue$/i }),
    ).toBeInTheDocument()
  })

  const trimmedName = character.name.trim()
  const namePattern = new RegExp(
    escapeRegExp(trimmedName.length > 0 ? trimmedName : 'Unnamed'),
    'i',
  )

  await user.click(screenInstance.getByRole('button', { name: namePattern }))

  await waitFor(() => {
    expect(
      screenInstance.getByRole('navigation', {
        name: /character creation steps/i,
      }),
    ).toBeInTheDocument()
  })
}
