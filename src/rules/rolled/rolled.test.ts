import { describe, expect, it } from 'vitest'
import {
  computeGeneratedTotal,
  getDroppedDice,
  getKeptDice,
} from './abilityScoreResult'
import {
  createSeededRandomSource,
  rollD6,
} from './random'
import {
  DEFAULT_ROLLING_FORMULA_ID,
  ROLLED_ABILITY_SCORE_COUNT,
  ROLLED_MAX_TOTAL,
  ROLLED_MIN_TOTAL,
  generateAbilityScorePool,
  generateAbilityScoreRoll,
  getRollingFormula,
  isValidRolledTotal,
} from './rollingFormula'
import {
  createEmptyRolledAssignments,
  getRemainingRolledResults,
  rolledAssignmentsToAbilityScores,
  validateRolledAssignment,
} from './rolledAssignment'

describe('rollD6 with seeded RNG', () => {
  it('returns deterministic values for a fixed seed', () => {
    const rng = createSeededRandomSource(42)

    expect([rollD6(rng), rollD6(rng), rollD6(rng), rollD6(rng)]).toEqual([
      4, 3, 6, 5,
    ])
  })
})

describe('generateAbilityScoreRoll (4d6-drop-lowest)', () => {
  it('produces a deterministic generated result for a fixed seed', () => {
    const rng = createSeededRandomSource(99)
    const roll = generateAbilityScoreRoll(DEFAULT_ROLLING_FORMULA_ID, rng)

    expect(roll).toEqual({
      kind: 'generated',
      formulaId: '4d6-drop-lowest',
      dice: [
        { index: 0, value: 2, dropped: true },
        { index: 1, value: 5, dropped: false },
        { index: 2, value: 4, dropped: false },
        { index: 3, value: 5, dropped: false },
      ],
      modifiers: [],
      total: 14,
    })
  })

  it('marks exactly one die as dropped and totals kept dice', () => {
    const roll = generateAbilityScoreRoll(
      DEFAULT_ROLLING_FORMULA_ID,
      createSeededRandomSource(7),
    )

    expect(getDroppedDice(roll)).toHaveLength(1)
    expect(getKeptDice(roll).reduce((sum, value) => sum + value, 0)).toBe(
      roll.total,
    )
    expect(roll.total).toBeGreaterThanOrEqual(ROLLED_MIN_TOTAL)
    expect(roll.total).toBeLessThanOrEqual(ROLLED_MAX_TOTAL)
  })

  it('drops the first lowest die when there is a tie', () => {
    const total = computeGeneratedTotal(
      [
        { index: 0, value: 3, dropped: true },
        { index: 1, value: 3, dropped: false },
        { index: 2, value: 5, dropped: false },
        { index: 3, value: 6, dropped: false },
      ],
      [],
    )

    expect(total).toBe(14)
  })
})

describe('generateAbilityScorePool', () => {
  it('generates the requested number of rolls before any playback', () => {
    const pool = generateAbilityScorePool(
      ROLLED_ABILITY_SCORE_COUNT,
      DEFAULT_ROLLING_FORMULA_ID,
      createSeededRandomSource(1),
    )

    expect(pool).toHaveLength(6)
    expect(pool.every((roll) => roll.kind === 'generated')).toBe(true)
  })
})

describe('rolling formula registry', () => {
  it('exposes the default 4d6-drop-lowest formula', () => {
    const formula = getRollingFormula(DEFAULT_ROLLING_FORMULA_ID)

    expect(formula.label).toBe('4d6, drop lowest')
    expect(formula.minTotal).toBe(ROLLED_MIN_TOTAL)
    expect(formula.maxTotal).toBe(ROLLED_MAX_TOTAL)
  })
})

describe('isValidRolledTotal', () => {
  it('accepts totals within the default formula range', () => {
    expect(isValidRolledTotal(3)).toBe(true)
    expect(isValidRolledTotal(18)).toBe(true)
  })

  it('rejects totals outside the default formula range', () => {
    expect(isValidRolledTotal(2)).toBe(false)
    expect(isValidRolledTotal(19)).toBe(false)
    expect(isValidRolledTotal(10.5)).toBe(false)
  })
})

describe('validateRolledAssignment', () => {
  const pool = [
    { id: 'rolled-0', total: 15 },
    { id: 'rolled-1', total: 15 },
    { id: 'rolled-2', total: 13 },
    { id: 'rolled-3', total: 12 },
    { id: 'rolled-4', total: 10 },
    { id: 'rolled-5', total: 8 },
  ]

  it('reports unassigned abilities while the draft is incomplete', () => {
    const validation = validateRolledAssignment(pool, {
      ...createEmptyRolledAssignments(),
      strength: 'rolled-0',
    })

    expect(validation.valid).toBe(false)
    if (!validation.valid) {
      expect(validation.issues.some((issue) => issue.code === 'unassigned-ability')).toBe(
        true,
      )
    }
  })

  it('accepts duplicate totals when each roll id is used once', () => {
    const validation = validateRolledAssignment(pool, {
      strength: 'rolled-0',
      dexterity: 'rolled-1',
      constitution: 'rolled-2',
      intelligence: 'rolled-3',
      wisdom: 'rolled-4',
      charisma: 'rolled-5',
    })

    expect(validation.valid).toBe(true)
  })

  it('rejects assigning the same roll id to multiple abilities', () => {
    const validation = validateRolledAssignment(pool, {
      strength: 'rolled-0',
      dexterity: 'rolled-0',
      constitution: 'rolled-2',
      intelligence: 'rolled-3',
      wisdom: 'rolled-4',
      charisma: 'rolled-5',
    })

    expect(validation.valid).toBe(false)
    if (!validation.valid) {
      expect(validation.issues).toContainEqual({
        code: 'duplicate-roll-id',
        rollId: 'rolled-0',
        abilities: ['strength', 'dexterity'],
      })
    }
  })
})

describe('getRemainingRolledResults', () => {
  it('returns pool entries whose ids are not yet assigned', () => {
    const pool = [
      { id: 'rolled-0', total: 15 },
      { id: 'rolled-1', total: 14 },
      { id: 'rolled-2', total: 13 },
      { id: 'rolled-3', total: 12 },
      { id: 'rolled-4', total: 10 },
      { id: 'rolled-5', total: 8 },
    ]

    const remaining = getRemainingRolledResults(pool, {
      ...createEmptyRolledAssignments(),
      strength: 'rolled-0',
      dexterity: 'rolled-1',
    })

    expect(remaining.map((entry) => entry.id)).toEqual([
      'rolled-2',
      'rolled-3',
      'rolled-4',
      'rolled-5',
    ])
  })
})

describe('rolledAssignmentsToAbilityScores', () => {
  it('maps assigned roll ids to numeric totals', () => {
    const pool = [
      { id: 'rolled-0', total: 15 },
      { id: 'rolled-1', total: 14 },
      { id: 'rolled-2', total: 13 },
      { id: 'rolled-3', total: 12 },
      { id: 'rolled-4', total: 10 },
      { id: 'rolled-5', total: 8 },
    ]

    expect(
      rolledAssignmentsToAbilityScores(pool, {
        strength: 'rolled-0',
        dexterity: 'rolled-1',
        constitution: 'rolled-2',
        intelligence: 'rolled-3',
        wisdom: 'rolled-4',
        charisma: 'rolled-5',
      }),
    ).toEqual({
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    })
  })
})
