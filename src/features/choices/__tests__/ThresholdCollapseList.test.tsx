/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  formatThresholdCollapseTitle,
  ThresholdCollapseList,
} from '../ThresholdCollapseList'

function renderList(itemCount: number) {
  const items = Array.from({ length: itemCount }, (_, index) => (
    <li key={index}>Spell {index + 1}</li>
  ))

  return render(
    <ThresholdCollapseList
      id="granted"
      title={formatThresholdCollapseTitle('Granted Spells', itemCount)}
      itemCount={itemCount}
    >
      <ul aria-label="Granted Spells">{items}</ul>
    </ThresholdCollapseList>,
  )
}

describe('ThresholdCollapseList', () => {
  it('renders nothing special for an empty list (no accordion)', () => {
    renderList(0)

    expect(
      screen.queryByRole('button', { name: /Granted Spells/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: /Granted Spells/i }),
    ).toBeInTheDocument()
  })

  it('shows a short list of 1 directly without an accordion', () => {
    renderList(1)

    expect(
      screen.queryByRole('button', { name: /Granted Spells/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Spell 1')).toBeInTheDocument()
  })

  it('shows a list of 3 directly without an accordion', () => {
    renderList(3)

    expect(
      screen.queryByRole('button', { name: /Granted Spells/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Spell 1')).toBeInTheDocument()
    expect(screen.getByText('Spell 3')).toBeInTheDocument()
  })

  it('collapses lists of 4+ into a default-collapsed accordion', async () => {
    const user = userEvent.setup()
    renderList(4)

    const header = screen.getByRole('button', {
      name: /Granted Spells · 4/i,
    })
    expect(header).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('list', { name: /Granted Spells/i }),
    ).not.toBeInTheDocument()

    await user.click(header)
    expect(header).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('list', { name: /Granted Spells/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Spell 1')).toBeInTheDocument()
    expect(screen.getByText('Spell 4')).toBeInTheDocument()
  })

  it('preserves item order when expanded', async () => {
    const user = userEvent.setup()
    renderList(4)

    await user.click(
      screen.getByRole('button', { name: /Granted Spells · 4/i }),
    )

    const items = screen.getAllByRole('listitem').map((node) => node.textContent)
    expect(items).toEqual(['Spell 1', 'Spell 2', 'Spell 3', 'Spell 4'])
  })
})
