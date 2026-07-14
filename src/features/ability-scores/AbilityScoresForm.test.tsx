// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AbilityScoresForm } from './AbilityScoresForm'
import { createEmptyStandardArrayDraft } from './standardArrayDraft'

const defaultProps = {
  creationMethod: 'standard-array' as const,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  standardArrayDraft: createEmptyStandardArrayDraft(),
  pointBuyDraft: null,
  rolledDraft: null,
  prefersReducedMotion: false,
  onCreationMethodChange: vi.fn(),
  onAbilityScoreChange: vi.fn(),
  onStandardArrayDraftChange: vi.fn(),
  onClearStandardArray: vi.fn(),
  onApplyDefaultStandardArray: vi.fn(),
  onStartPointBuy: vi.fn(),
  onResetPointBuy: vi.fn(),
  onAdjustPointBuyScore: vi.fn(),
  onRolledPoolReady: vi.fn(),
  onRolledAssignmentChange: vi.fn(),
}

describe('AbilityScoresForm standard array guidance', () => {
  it('does not render character basics fields', () => {
    render(<AbilityScoresForm {...defaultProps} />)

    expect(
      screen.queryByRole('textbox', { name: /character name/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: /rules edition/i }),
    ).not.toBeInTheDocument()
  })

  it('shows remaining values that update after an assignment', () => {
    const { rerender } = render(<AbilityScoresForm {...defaultProps} />)

    expect(screen.getByText(/remaining scores:/i)).toHaveTextContent(
      '15, 14, 13, 12, 10, 8',
    )

    rerender(
      <AbilityScoresForm
        {...defaultProps}
        standardArrayDraft={{
          ...createEmptyStandardArrayDraft(),
          strength: 15,
        }}
      />,
    )

    expect(screen.getByText(/remaining scores:/i)).toHaveTextContent(
      '14, 13, 12, 10, 8',
    )
  })

  it('calls clear assignments from the form', async () => {
    const user = userEvent.setup()
    const onClearStandardArray = vi.fn()

    render(
      <AbilityScoresForm
        {...defaultProps}
        onClearStandardArray={onClearStandardArray}
      />,
    )

    await user.click(screen.getByRole('button', { name: /clear assignments/i }))
    expect(onClearStandardArray).toHaveBeenCalled()
  })

  it('shows the beginner explanation for standard array', () => {
    render(<AbilityScoresForm {...defaultProps} />)

    expect(
      screen.getByText(
        /assign each score exactly once\. higher scores give stronger bonuses/i,
      ),
    ).toBeInTheDocument()
  })

  it('shows validation issues for an invalid point-buy draft', () => {
    render(
      <AbilityScoresForm
        {...defaultProps}
        creationMethod="point-buy"
        pointBuyDraft={{
          strength: 15,
          dexterity: 15,
          constitution: 15,
          intelligence: 15,
          wisdom: 15,
          charisma: 15,
        }}
      />,
    )

    expect(
      screen.getByText(/this assignment spends 54 of 27 points/i),
    ).toBeInTheDocument()
  })
})
