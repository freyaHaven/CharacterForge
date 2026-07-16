// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AbilityScoresStep } from './AbilityScoresStep'
import { createEmptyStandardArrayDraft } from '../../../features/ability-scores/standardArrayDraft'

const defaultProps = {
  creationMethod: 'manual' as const,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  standardArrayDraft: null,
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

describe('AbilityScoresStep', () => {
  it('renders the step heading and ability scores form', () => {
    render(<AbilityScoresStep {...defaultProps} />)

    expect(
      screen.getByRole('heading', { name: 'Abilities', level: 2 }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('radio', { name: /^Manual/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /ability score method/i })).toBeInTheDocument()
  })

  it('passes standard array props through to the form', () => {
    render(
      <AbilityScoresStep
        {...defaultProps}
        creationMethod="standard-array"
        standardArrayDraft={createEmptyStandardArrayDraft()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /apply default standard array/i }),
    ).toBeInTheDocument()
  })
})
