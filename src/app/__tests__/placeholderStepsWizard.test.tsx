// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { getWizardStepButton, goToWizardStep } from '../../testing/wizardTestUtils'
import {
  clearEditorSession,
  openCharacterEditor,
} from '../../testing/characterEditorTestUtils'

const { loadMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
}))

vi.mock('../../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: vi.fn(),
    remove: vi.fn(),
  }),
}))

describe('Placeholder wizard steps', () => {
  beforeEach(() => {
    clearEditorSession()
    loadMock.mockReset()
    loadMock.mockResolvedValue(null)
  })

  async function renderApp() {
    const user = userEvent.setup()
    render(<App />)

    await openCharacterEditor(user)

    return { user }
  }

  it('reports Class as required and not started on a fresh character', async () => {
    await renderApp()

    expect(getWizardStepButton(screen, 'Class')).toHaveAccessibleName(
      /not started/i,
    )
    expect(getWizardStepButton(screen, 'Background')).toHaveAccessibleName(
      /not started/i,
    )
    expect(getWizardStepButton(screen, 'Equipment')).toHaveAccessibleName(
      /not started/i,
    )
  })

  it('navigates to the class picker and placeholder steps', async () => {
    const { user } = await renderApp()

    await goToWizardStep(user, screen, 'Class')
    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('radio', { name: /single class/i }))
    expect(screen.getByRole('button', { name: 'Fighter' })).toBeInTheDocument()

    await goToWizardStep(user, screen, 'Background')
    expect(
      screen.getByRole('heading', { name: 'Background', level: 2 }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(/loading backgrounds/i)).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Soldier' })).toBeInTheDocument()

    await goToWizardStep(user, screen, 'Equipment')
    expect(
      screen.getByRole('heading', { name: 'Equipment', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/starting weapons, armour, tools, and supplies/i),
    ).toBeInTheDocument()
  })
})
