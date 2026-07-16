// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HitPointIncreasePanel } from '../HitPointIncreasePanel'

describe('HitPointIncreasePanel', () => {
  it('renders a progression table with locked maximum for starting-class level 1', () => {
    render(
      <HitPointIncreasePanel
        hitDie={{ sides: 10 }}
        level={1}
        isStartingClass
        increases={[{ classLevel: 1, method: 'max' }]}
        onChange={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Hit Point Progression' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Level' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Method' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'HP Gain' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Action' })).toBeInTheDocument()

    const row = screen.getByRole('row', { name: /1/ })
    expect(within(row).getByText('Maximum')).toBeInTheDocument()
    expect(within(row).getByText('+10')).toBeInTheDocument()
    expect(within(row).queryByLabelText('Fixed')).not.toBeInTheDocument()
    expect(within(row).queryByRole('button', { name: /roll/i })).not.toBeInTheDocument()
  })

  it('lets the player choose fixed or roll inline for later levels', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <HitPointIncreasePanel
        hitDie={{ sides: 10 }}
        level={2}
        isStartingClass
        increases={[
          { classLevel: 1, method: 'max' },
          { classLevel: 2, method: 'fixed' },
        ]}
        onChange={onChange}
      />,
    )

    const levelTwo = screen.getByRole('row', { name: /2/ })
    expect(within(levelTwo).getByText('+6')).toBeInTheDocument()
    expect(within(levelTwo).getByLabelText('Fixed')).toBeChecked()
    expect(within(levelTwo).getByText('—')).toBeInTheDocument()

    await user.click(within(levelTwo).getByLabelText('Roll'))

    expect(onChange).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        method: 'roll',
        rolledValue: expect.any(Number),
      }),
    )
  })

  it('shows Re-roll for rolled levels and keeps the same callback', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <HitPointIncreasePanel
        hitDie={{ sides: 10 }}
        level={2}
        isStartingClass
        increases={[
          { classLevel: 1, method: 'max' },
          { classLevel: 2, method: 'roll', rolledValue: 9 },
        ]}
        onChange={onChange}
      />,
    )

    const levelTwo = screen.getByRole('row', { name: /2/ })
    expect(within(levelTwo).getByText('+9')).toBeInTheDocument()

    await user.click(within(levelTwo).getByRole('button', { name: 'Re-roll' }))

    expect(onChange).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        method: 'roll',
        rolledValue: expect.any(Number),
      }),
    )
  })
})
