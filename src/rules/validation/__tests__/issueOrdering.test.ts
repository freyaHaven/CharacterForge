import { describe, expect, it } from 'vitest'
import {
  compareValidationIssues,
  sortValidationIssues,
  validationIssueBand,
} from '../issueOrdering'

describe('validation issue ordering', () => {
  it('maps known codes to priority bands', () => {
    expect(validationIssueBand('class-not-found')).toBe('structural')
    expect(validationIssueBand('inactive-source-state')).toBe('inactive')
    expect(validationIssueBand('multiclass-ability-prerequisite')).toBe(
      'prerequisite',
    )
    expect(validationIssueBand('missing-required-choice')).toBe(
      'missing-top-level',
    )
    expect(validationIssueBand('duplicate-selection')).toBe(
      'duplicate-or-exclusive',
    )
    expect(validationIssueBand('spell-not-on-list')).toBe('spell-selection')
    expect(validationIssueBand('incomplete-choice')).toBe('missing-top-level')
    expect(validationIssueBand('unknown-future-code')).toBe('informational')
  })

  it('sorts issues by band then stable identity fields', () => {
    const sorted = sortValidationIssues([
      {
        code: 'under-limit',
        sourceKey: 'b',
        entitlementId: 'prepared',
        message: 'under',
      },
      {
        code: 'class-not-found',
        sourceKey: 'a',
        message: 'missing class',
      },
      {
        code: 'inactive-source-state',
        sourceKey: 'z',
        message: 'stale',
      },
      {
        code: 'duplicate-selection',
        sourceKey: 'a',
        entitlementId: 'prepared',
        spellId: 'srd-2024:fireball',
      },
      {
        code: 'multiclass-ability-prerequisite',
        sourceKey: 'a',
        message: 'prereq',
      },
    ])

    expect(sorted.map((issue) => issue.code)).toEqual([
      'class-not-found',
      'inactive-source-state',
      'multiclass-ability-prerequisite',
      'under-limit',
      'duplicate-selection',
    ])
  })

  it('is deterministic for equal-priority ties', () => {
    const left = {
      code: 'under-limit',
      sourceKey: 'class:a:prepared',
      entitlementId: 'prepared',
    }
    const right = {
      code: 'under-limit',
      sourceKey: 'class:b:prepared',
      entitlementId: 'prepared',
    }
    expect(compareValidationIssues(left, right)).toBeLessThan(0)
    expect(compareValidationIssues(right, left)).toBeGreaterThan(0)
    expect(compareValidationIssues(left, left)).toBe(0)
  })
})
