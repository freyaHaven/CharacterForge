// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChoiceAccordion } from './ChoiceAccordion'

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

describe('ChoiceAccordion', () => {
  it('shows the title and no selection summary when collapsed', () => {
    render(
      <ChoiceAccordion
        id="fighting-style"
        title="Fighting Style"
        options={STYLE_OPTIONS}
        selectedOptionId={null}
        name="fighting-style"
        defaultExpanded={false}
        onSelect={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('No selection')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('expands and collapses from the header button', async () => {
    const user = userEvent.setup()

    render(
      <ChoiceAccordion
        id="fighting-style"
        title="Fighting Style"
        options={STYLE_OPTIONS}
        selectedOptionId={null}
        name="fighting-style"
        defaultExpanded={false}
        onSelect={vi.fn()}
      />,
    )

    const header = screen.getByRole('button', { name: /Fighting Style/i })

    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: /Defense/i })).toBeInTheDocument()

    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('selects an option, updates the summary, and collapses automatically', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <ChoiceAccordion
        id="fighting-style"
        title="Fighting Style"
        options={STYLE_OPTIONS}
        selectedOptionId={null}
        name="fighting-style"
        defaultExpanded
        onSelect={onSelect}
      />,
    )

    await user.click(screen.getByRole('radio', { name: /Archery/i }))

    expect(onSelect).toHaveBeenCalledWith('archery')
    expect(
      screen.getByRole('button', { name: /Fighting Style/i }),
    ).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Archery')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('shows the selected option in the collapsed summary', () => {
    render(
      <ChoiceAccordion
        id="fighting-style"
        title="Fighting Style"
        options={STYLE_OPTIONS}
        selectedOptionId="defense"
        name="fighting-style"
        defaultExpanded={false}
        onSelect={vi.fn()}
      />,
    )

    expect(
      document.querySelector('.choice-accordion__summary'),
    ).toHaveTextContent('Defense')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })
})
