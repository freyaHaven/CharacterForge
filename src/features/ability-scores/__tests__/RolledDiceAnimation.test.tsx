// @vitest-environment jsdom

import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RolledDiceAnimation } from '../RolledDiceAnimation'
import { buildRollPresentationSequence } from '../rollPresentation'
import type { GeneratedAbilityScoreResult } from '../../../rules/rolled'

const generatedRoll: GeneratedAbilityScoreResult = {
  kind: 'generated',
  formulaId: '4d6-drop-lowest',
  dice: [
    { index: 0, value: 4, dropped: false },
    { index: 1, value: 5, dropped: false },
    { index: 2, value: 2, dropped: true },
    { index: 3, value: 6, dropped: false },
  ],
  modifiers: [],
  total: 15,
}

describe('RolledDiceAnimation', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the textual result immediately when playback is instant', () => {
    const onComplete = vi.fn()

    render(
      <RolledDiceAnimation
        result={generatedRoll}
        sequence={buildRollPresentationSequence(generatedRoll, { instant: true })}
        instant
        onComplete={onComplete}
      />,
    )

    expect(
      screen.getByText('4, 5, 2, 6 — drop 2 — total 15'),
    ).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reveals the final total after the presentation sequence completes', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    render(
      <RolledDiceAnimation
        result={generatedRoll}
        sequence={buildRollPresentationSequence(generatedRoll)}
        instant={false}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByText('Rolling ability score...')).toBeInTheDocument()

    await act(async () => {
      vi.runAllTimers()
    })

    expect(
      screen.getByText('4, 5, 2, 6 — drop 2 — total 15'),
    ).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
