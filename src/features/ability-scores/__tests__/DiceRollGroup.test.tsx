// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiceRollGroup } from '../DiceRollGroup'
import type { GeneratedAbilityScoreResult } from '../../../rules/rolled'

const generatedRoll: GeneratedAbilityScoreResult = {
  kind: 'generated',
  formulaId: '4d6-drop-lowest',
  dice: [
    { index: 0, value: 5, dropped: false },
    { index: 1, value: 6, dropped: false },
    { index: 2, value: 2, dropped: true },
    { index: 3, value: 4, dropped: false },
  ],
  modifiers: [],
  total: 15,
}

describe('DiceRollGroup', () => {
  it('shows a prominent total and four dice without debug phrasing', () => {
    render(<DiceRollGroup result={generatedRoll} title="Roll 1" />)

    expect(
      document.querySelector('.dice-roll-group__total'),
    ).toHaveTextContent('15')
    expect(
      document.querySelector('.dice-roll-group__total'),
    ).toHaveAttribute('aria-label', 'Roll total: 15')
    expect(screen.queryByText(/drop /i)).not.toBeInTheDocument()

    const discarded = screen.getByLabelText('Discarded die 2')
    expect(discarded).toHaveClass('dice-roll-group__die--discarded')
    expect(discarded).toHaveTextContent('2')

    expect(screen.getByLabelText('Kept die 5')).toHaveClass(
      'dice-roll-group__die--kept',
    )
  })

  it('exposes an accessible summary that names kept and discarded dice', () => {
    render(<DiceRollGroup result={generatedRoll} />)

    expect(
      screen.getByLabelText(
        'Roll total: 15. Dice: 5 kept, 6 kept, 2 discarded, 4 kept',
      ),
    ).toBeInTheDocument()
  })
})
