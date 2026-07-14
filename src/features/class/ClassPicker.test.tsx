// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { createBundledClassCatalog } from '../../adapters/bundledClassCatalog'
import type { ClassSelection } from '../../domain/class/types'
import {
  createClassSelectionDraft,
  type ClassSelectionDraft,
} from './classSelectionDraft'
import { ClassPicker } from './ClassPicker'

function ClassPickerHarness({
  initialCommitted = null,
  initialDraft = null,
}: {
  initialCommitted?: ClassSelection | null
  initialDraft?: ClassSelectionDraft | null
}) {
  const [committedSelection, setCommittedSelection] =
    useState<ClassSelection | null>(initialCommitted)
  const [draft, setDraft] = useState<ClassSelectionDraft | null>(initialDraft)
  const catalog = createBundledClassCatalog()

  return (
    <ClassPicker
      editionId="srd-2024"
      committedSelection={committedSelection}
      draft={draft}
      catalog={catalog}
      onDraftChange={setDraft}
      onCommittedSelectionChange={setCommittedSelection}
    />
  )
}

async function waitForClassesLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading classes/i)).not.toBeInTheDocument()
  })
}

describe('ClassPicker', () => {
  it('shows fighter choices on the first click without committing', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.getByRole('group', { name: /choose a fighting style/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /choose two skill proficiencies/i }),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.class-picker__selection'),
    ).toHaveTextContent(/Selecting:.*complete required choices to confirm/i)
    expect(screen.queryByText(/^Selected: Fighter$/i)).not.toBeInTheDocument()
  })

  it('does not show choices after focus alone', async () => {
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    fireEvent.focus(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.queryByRole('group', { name: /choose a fighting style/i }),
    ).not.toBeInTheDocument()
  })

  it('filters catalogue cards by class name without changing selection', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))

    await user.type(screen.getByRole('searchbox', { name: /search classes/i }), 'zzz')

    expect(screen.queryByRole('button', { name: 'Fighter' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fighter' })).toBeInTheDocument()
    expect(
      screen.getByText(/selected class is hidden by the current search/i),
    ).toBeInTheDocument()
    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      'Selected: Fighter',
    )
  })

  it('commits when fighting style and exactly two skills are chosen', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Archery/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Survival' }))

    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      'Selected: Fighter',
    )
    expect(
      document.querySelector('.class-picker__selection'),
    ).not.toHaveTextContent(/complete required choices to confirm/i)
  })

  it('prevents selecting more than two skills and allows deselection', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarness
        initialDraft={createClassSelectionDraft('srd-2024:fighter')}
      />,
    )
    await waitForClassesLoaded()

    const athletics = screen.getByRole('checkbox', { name: 'Athletics' })
    const perception = screen.getByRole('checkbox', { name: 'Perception' })
    const history = screen.getByRole('checkbox', { name: 'History' })

    await user.click(athletics)
    await user.click(perception)
    expect(history).toBeDisabled()

    await user.click(athletics)
    expect(history).not.toBeDisabled()
    expect(screen.getByText(/selected 1 of 2/i)).toBeInTheDocument()
  })

  it('returns to draft-only when a committed skill is deselected', async () => {
    const user = userEvent.setup()
    render(
      <ClassPickerHarness
        initialCommitted={{
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {
            'fighting-style': 'defense',
            'skill-proficiencies': ['athletics', 'perception'],
          },
        }}
      />,
    )
    await waitForClassesLoaded()

    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))

    expect(
      document.querySelector('.class-picker__selection'),
    ).toHaveTextContent(/Selecting:.*complete required choices to confirm/i)
    expect(screen.queryByText(/^Selected: Fighter$/i)).not.toBeInTheDocument()
  })

  it('shows level 1 features including weapon mastery guidance', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(screen.getByText('Weapon Mastery')).toBeInTheDocument()
    expect(screen.getByText(/equipment step/i)).toBeInTheDocument()
    expect(screen.getByText(/three kinds of weapons/i)).toBeInTheDocument()
  })

  it('uses real buttons with a non-colour-only selected state', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    const selectedCard = screen.getByRole('button', { name: 'Fighter' })
    expect(selectedCard).toHaveAttribute('aria-pressed', 'true')
    expect(
      selectedCard.querySelector('.class-picker__card-badge[aria-hidden="true"]'),
    ).not.toBeNull()
  })
})
