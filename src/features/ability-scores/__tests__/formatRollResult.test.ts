import { describe, expect, it } from 'vitest'
import {
  formatGeneratedRollText,
  formatManualRollText,
  formatRolledResultText,
} from '../formatRollResult'
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

describe('formatRollResult', () => {
  it('formats generated rolls with dice, dropped die, and total', () => {
    expect(formatGeneratedRollText(generatedRoll)).toBe(
      '4, 5, 2, 6 — drop 2 — total 15',
    )
  })

  it('formats manual rolls clearly without dice breakdown', () => {
    expect(formatManualRollText(14)).toBe('Manual result: 14')
    expect(formatRolledResultText({ kind: 'manual', total: 14 })).toBe(
      'Manual result: 14',
    )
  })
})
