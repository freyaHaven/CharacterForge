// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { FeatureChoiceCard } from '../FeatureChoiceCard'

const STYLE_OPTIONS = [
  {
    id: 'defense',
    label: 'Defense',
    description: 'While you are wearing armor, you gain a +1 bonus to AC.',
  },
  {
    id: 'archery',
    label: 'Archery',
    description: 'You gain a +2 bonus to attack rolls with ranged weapons.',
  },
] as const

function FeatureChoiceCardHarness({
  initialSelected = null,
  defaultExpanded = false,
}: {
  initialSelected?: string | null
  defaultExpanded?: boolean
}) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    initialSelected,
  )

  return (
    <FeatureChoiceCard
      id="fighting-style"
      title="Fighting Style"
      description="You gain a Fighting Style feat of your choice."
      options={STYLE_OPTIONS}
      selectedOptionId={selectedOptionId}
      name="fighting-style"
      defaultExpanded={defaultExpanded}
      onSelect={setSelectedOptionId}
    />
  )
}

describe('FeatureChoiceCard', () => {
  it('keeps the description visible and shows no selection when collapsed', () => {
    render(<FeatureChoiceCardHarness defaultExpanded={false} />)

    expect(
      screen.getByText('You gain a Fighting Style feat of your choice.'),
    ).toBeInTheDocument()
    expect(screen.getByText('No selection')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('expands to show radio options inside the same card', async () => {
    const user = userEvent.setup()

    render(<FeatureChoiceCardHarness defaultExpanded={false} />)

    await user.click(screen.getByRole('button', { name: /Fighting Style/i }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()
    expect(
      screen.getByText('You gain a Fighting Style feat of your choice.'),
    ).toBeInTheDocument()
  })

  it('updates the collapsed summary and auto-collapses after selection', async () => {
    const user = userEvent.setup()

    render(<FeatureChoiceCardHarness defaultExpanded />)

    await user.click(screen.getByRole('radio', { name: /Archery/i }))

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'false')

    const summary = document.querySelector(
      '.feature-choice-card__selection-summary',
    )
    expect(summary).toHaveTextContent('Selected: Archery')
    expect(summary).toHaveTextContent(
      'You gain a +2 bonus to attack rolls with ranged weapons.',
    )
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('shows only the selected label when the option has no description', () => {
    render(
      <FeatureChoiceCard
        id="test-choice"
        title="Test Choice"
        description="Choose one option."
        options={[{ id: 'alpha', label: 'Alpha' }]}
        selectedOptionId="alpha"
        name="test-choice"
        defaultExpanded={false}
        onSelect={vi.fn()}
      />,
    )

    const summary = document.querySelector(
      '.feature-choice-card__selection-summary',
    )
    expect(summary).toHaveTextContent('Selected: Alpha')
    expect(
      summary?.querySelector('.feature-choice-card__selection-description'),
    ).toBeNull()
  })
})
