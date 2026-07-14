import { describe, expect, it } from 'vitest'
import { buildRollPresentationSequence } from './rollPresentation'
import type { GeneratedAbilityScoreResult } from '../../rules/rolled'

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

describe('buildRollPresentationSequence', () => {
  it('builds sequential reveal events for animated playback', () => {
    const sequence = buildRollPresentationSequence(generatedRoll)

    expect(sequence.instant).toBe(false)
    expect(sequence.events.map((event) => event.phase)).toEqual([
      'reveal-die',
      'reveal-die',
      'reveal-die',
      'reveal-die',
      'mark-dropped',
      'show-total',
    ])
    expect(sequence.events.at(-1)?.total).toBe(15)
  })

  it('collapses to an instant sequence when skipping all animations', () => {
    const sequence = buildRollPresentationSequence(generatedRoll, { instant: true })

    expect(sequence.instant).toBe(true)
    expect(sequence.durationMs).toBe(0)
    expect(sequence.events).toEqual([
      {
        phase: 'show-total',
        droppedDieIndices: [2],
        total: 15,
        delayMs: 0,
      },
    ])
  })
})
