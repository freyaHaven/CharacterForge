// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AbilityScoresForm } from '../AbilityScoresForm'
import { createEmptyStandardArrayDraft } from '../standardArrayDraft'

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

  it('does not show a remaining scores sentence', () => {
    render(<AbilityScoresForm {...defaultProps} />)

    expect(screen.queryByText(/remaining scores:/i)).not.toBeInTheDocument()
  })

  it('calls clear assignments from the form', async () => {
    const user = userEvent.setup()
    const onClearStandardArray = vi.fn()

    render(
      <AbilityScoresForm
        {...defaultProps}
        standardArrayDraft={{
          ...createEmptyStandardArrayDraft(),
          strength: 15,
        }}
        onClearStandardArray={onClearStandardArray}
      />,
    )

    await user.click(screen.getByRole('button', { name: /clear assignments/i }))
    expect(onClearStandardArray).toHaveBeenCalled()
  })

  it('hides clear assignments when nothing is assigned', () => {
    render(<AbilityScoresForm {...defaultProps} />)

    expect(
      screen.queryByRole('button', { name: /clear assignments/i }),
    ).not.toBeInTheDocument()
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

  it('places the ability overview before dice roll groups for manual mode', () => {
    render(
      <AbilityScoresForm {...defaultProps} creationMethod="manual" />,
    )

    const overview = screen.getByTestId('ability-score-overview-strength')
    const diceHeading = screen.getByRole('heading', {
      name: /dice roll groups/i,
    })

    expect(
      overview.compareDocumentPosition(diceHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('does not show rolled remaining-results or manual help copy', () => {
    render(
      <AbilityScoresForm {...defaultProps} creationMethod="manual" />,
    )

    expect(
      screen.queryByText(/type scores directly below/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/remaining results:/i)).not.toBeInTheDocument()
  })
})
