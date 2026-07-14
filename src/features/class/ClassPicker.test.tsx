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

async function expandFightingStyleAccordion(
  user: ReturnType<typeof userEvent.setup>,
) {
  const header = screen.getByRole('button', { name: /Fighting Style/i })
  if (header.getAttribute('aria-expanded') === 'false') {
    await user.click(header)
  }
}

async function setStartingLevel(level: number) {
  const input = screen.getByRole('spinbutton', { name: /starting level/i })
  fireEvent.change(input, { target: { value: String(level) } })
  fireEvent.blur(input)

  await waitFor(() => {
    expect(input).toHaveValue(level)
  })
}

describe('ClassPicker', () => {
  it('shows fighter choices on the first click without committing', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()
    expect(
      screen.getByRole('group', { name: /choose two skill proficiencies/i }),
    ).toBeInTheDocument()
    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      /Selecting:.*level 1.*complete required choices to confirm/i,
    )
    expect(screen.queryByText(/^Selected: Fighter$/i)).not.toBeInTheDocument()
  })

  it('does not show choices after focus alone', async () => {
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    fireEvent.focus(screen.getByRole('button', { name: 'Fighter' }))

    expect(
      screen.queryByRole('button', { name: /Fighting Style/i }),
    ).not.toBeInTheDocument()
  })

  it('filters catalogue cards by class name without changing selection', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await expandFightingStyleAccordion(user)
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
      'Selected: Fighter (level 1)',
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

    expect(screen.getByText('Selected: Archery')).toBeInTheDocument()
    expect(
      document.querySelector('.feature-choice-card__selection-description'),
    ).toHaveTextContent(
      /\+2 bonus to attack rolls you make with Ranged weapons/i,
    )
    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      'Selected: Fighter (level 1)',
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

    expect(screen.getByText('Selected: Defense')).toBeInTheDocument()
    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      /Selecting:.*level 1.*complete required choices to confirm/i,
    )
    expect(screen.queryByText(/^Selected: Fighter$/i)).not.toBeInTheDocument()
  })

  it('shows level 1 features including weapon mastery guidance', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))

    expect(screen.getByText('Weapon Mastery')).toBeInTheDocument()
    expect(screen.getByText('Level 1')).toBeInTheDocument()
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Second Wind/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Weapon Mastery/i })).not.toBeInTheDocument()
    expect(screen.getByText(/equipment step/i)).toBeInTheDocument()
    expect(screen.getByText(/three kinds of weapons/i)).toBeInTheDocument()
  })

  it('shows level 3 features and requires martial archetype before commit', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))

    await waitFor(() => {
      expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
        'Selected: Fighter (level 1)',
      )
    })

    await setStartingLevel(3)

    expect(screen.getByText('Level 3')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Martial Archetype/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      document.querySelector('.class-picker__selection'),
    ).toHaveTextContent(/Selecting:.*level 3.*complete required choices to confirm/i)
  })

  it('shows level 5 features after completing level 3 choices', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('checkbox', { name: 'Athletics' }))
    await user.click(screen.getByRole('checkbox', { name: 'Perception' }))
    await setStartingLevel(3)
    await user.click(
      screen.getByRole('radio', { name: /Champion \(placeholder\)/i }),
    )

    await waitFor(() => {
      expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
        'Selected: Fighter (level 3)',
      )
    })

    await setStartingLevel(5)

    expect(screen.getByText('Extra Attack')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(document.querySelector('.class-picker__selection')).toHaveTextContent(
      'Selected: Fighter (level 5)',
    )
  })

  it('preserves feature choice expansion state across level changes', async () => {
    const user = userEvent.setup()
    render(<ClassPickerHarness />)
    await waitForClassesLoaded()

    await user.click(screen.getByRole('button', { name: 'Fighter' }))
    await user.click(screen.getByRole('radio', { name: /Defense/i }))
    await user.click(screen.getByRole('button', { name: /Fighting Style/i }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')

    await setStartingLevel(3)

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('button', { name: /Martial Archetype/i }),
    ).toHaveAttribute('aria-expanded', 'true')

    await user.click(
      screen.getByRole('radio', { name: /Champion \(placeholder\)/i }),
    )
    await setStartingLevel(1)

    expect(
      screen.queryByRole('button', { name: /Martial Archetype/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
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
