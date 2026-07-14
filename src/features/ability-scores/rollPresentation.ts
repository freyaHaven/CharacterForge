import type { GeneratedAbilityScoreResult } from '../../rules/rolled'
import type { DieValue } from '../../rules/rolled'

export type RollPresentationPhase =
  | 'reveal-die'
  | 'mark-dropped'
  | 'show-total'

export type RollPresentationEvent = {
  readonly phase: RollPresentationPhase
  readonly dieIndex?: number
  readonly value?: DieValue
  readonly droppedDieIndices?: readonly number[]
  readonly total?: number
  readonly delayMs: number
}

export type RollPresentationSequence = {
  readonly events: readonly RollPresentationEvent[]
  readonly durationMs: number
  readonly instant: boolean
}

const REVEAL_DELAY_MS = 350
const DROP_DELAY_MS = 450
const TOTAL_DELAY_MS = 300

export function buildRollPresentationSequence(
  result: GeneratedAbilityScoreResult,
  options?: {
    instant?: boolean
  },
): RollPresentationSequence {
  if (options?.instant) {
    return {
      instant: true,
      durationMs: 0,
      events: [
        {
          phase: 'show-total',
          droppedDieIndices: result.dice
            .filter((die) => die.dropped)
            .map((die) => die.index),
          total: result.total,
          delayMs: 0,
        },
      ],
    }
  }

  const events: RollPresentationEvent[] = []

  for (const die of result.dice) {
    events.push({
      phase: 'reveal-die',
      dieIndex: die.index,
      value: die.value,
      delayMs: REVEAL_DELAY_MS,
    })
  }

  events.push({
    phase: 'mark-dropped',
    droppedDieIndices: result.dice
      .filter((die) => die.dropped)
      .map((die) => die.index),
    delayMs: DROP_DELAY_MS,
  })

  events.push({
    phase: 'show-total',
    total: result.total,
    delayMs: TOTAL_DELAY_MS,
  })

  return {
    instant: false,
    durationMs: events.reduce((sum, event) => sum + event.delayMs, 0),
    events,
  }
}
