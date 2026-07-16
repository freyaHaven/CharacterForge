import { describe, expect, it } from 'vitest'
import {
  assignRolledResult,
  createRolledDraftFromGeneratedResults,
  createRolledDraftFromManualTotals,
  initializeRolledDraftFromAbilityScores,
  shouldConfirmReroll,
  validateRolledDraft,
} from '../rolledDraft'
import { createEmptyRolledAssignments } from '../../../rules/rolled'
import type { GeneratedAbilityScoreResult } from '../../../rules/rolled'

const sampleGeneratedRoll: GeneratedAbilityScoreResult = {
  kind: 'generated',
  formulaId: '4d6-drop-lowest',
  dice: [
    { index: 0, value: 6, dropped: false },
    { index: 1, value: 2, dropped: true },
    { index: 2, value: 5, dropped: false },
    { index: 3, value: 4, dropped: false },
  ],
  modifiers: [],
  total: 15,
}

describe('createRolledDraftFromManualTotals', () => {
  it('creates six manual results without dice data', () => {
    const draft = createRolledDraftFromManualTotals([15, 14, 13, 12, 10, 8])
    if ('error' in draft) {
      throw new Error('Expected manual draft')
    }

    expect(draft.pool).toHaveLength(6)
    expect(draft.pool[0]).toEqual({
      id: 'rolled-0',
      total: 15,
      result: { kind: 'manual', total: 15 },
    })
    expect(draft.pool.every((entry) => entry.result.kind === 'manual')).toBe(true)
  })

  it('rejects invalid manual totals', () => {
    expect(createRolledDraftFromManualTotals([15, 14, 13, 12, 10])).toEqual({
      error: 'invalid-count',
    })
    expect(createRolledDraftFromManualTotals([15, 14, 13, 12, 10, 2])).toEqual({
      error: 'out-of-range',
    })
  })
})

describe('createRolledDraftFromGeneratedResults', () => {
  it('creates a pool with generated roll facts attached', () => {
    const draft = createRolledDraftFromGeneratedResults([
      sampleGeneratedRoll,
      { ...sampleGeneratedRoll, total: 14 },
    ])

    expect(draft.pool).toHaveLength(2)
    expect(draft.pool[0]?.result.kind).toBe('generated')
    expect(draft.assignments).toEqual(createEmptyRolledAssignments())
  })
})

describe('initializeRolledDraftFromAbilityScores', () => {
  it('reconstructs assignments for duplicate totals using ability order', () => {
    const draft = initializeRolledDraftFromAbilityScores({
      strength: 15,
      dexterity: 15,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    })

    expect(validateRolledDraft(draft).valid).toBe(true)
    expect(draft.pool.filter((entry) => entry.total === 15)).toHaveLength(2)
  })
})

describe('shouldConfirmReroll', () => {
  it('requires confirmation only when assignments exist', () => {
    expect(shouldConfirmReroll(createEmptyRolledAssignments())).toBe(false)
    expect(
      shouldConfirmReroll({
        ...createEmptyRolledAssignments(),
        strength: 'rolled-0',
      }),
    ).toBe(true)
  })
})

describe('assignRolledResult', () => {
  it('updates one ability assignment by roll id', () => {
    const draft = createRolledDraftFromManualTotals([15, 14, 13, 12, 10, 8])
    if ('error' in draft) {
      throw new Error('Expected manual draft')
    }

    const nextDraft = assignRolledResult(draft, 'strength', 'rolled-0')

    expect(nextDraft.assignments.strength).toBe('rolled-0')
    expect(nextDraft.assignments.dexterity).toBeNull()
  })
})
