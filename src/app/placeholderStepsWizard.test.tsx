// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { getWizardStepButton, goToWizardStep } from '../test/wizardTestUtils'

const { loadMock } = vi.hoisted(() => ({
  loadMock: vi.fn(),
}))

vi.mock('../adapters/localStorageCharacterRepository', () => ({
  createLocalStorageCharacterRepository: () => ({
    load: loadMock,
    save: vi.fn(),
  }),
}))

describe('Placeholder wizard steps', () => {
  beforeEach(() => {
    loadMock.mockReset()
    loadMock.mockResolvedValue(null)
  })

  async function renderApp() {
    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/loading character/i)).not.toBeInTheDocument()
    })

    return { user }
  }

  it('reports Class, Background, and Equipment as optional and not started', async () => {
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
    expect(getWizardStepButton(screen, 'Class')).not.toHaveAccessibleName(
      /needs attention/i,
    )
  })

  it('navigates between placeholder steps and shows their content', async () => {
    const { user } = await renderApp()

    await goToWizardStep(user, screen, 'Class')
    expect(
      screen.getByRole('heading', { name: 'Class', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
    expect(
      screen.queryByText(/class step content will appear here/i),
    ).not.toBeInTheDocument()

    await goToWizardStep(user, screen, 'Background')
    expect(
      screen.getByRole('heading', { name: 'Background', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/life before adventuring/i),
    ).toBeInTheDocument()

    await goToWizardStep(user, screen, 'Equipment')
    expect(
      screen.getByRole('heading', { name: 'Equipment', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/starting weapons, armour, tools, and supplies/i),
    ).toBeInTheDocument()
  })
})
