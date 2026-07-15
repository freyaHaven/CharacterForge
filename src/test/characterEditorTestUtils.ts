import type { UserEvent } from '@testing-library/user-event'
import type { Screen } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import {
  activateEditorSession,
  clearEditorSession,
} from '../app/session/editorSession'

export { activateEditorSession, clearEditorSession }

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
