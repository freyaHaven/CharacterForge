import { describe, expect, it } from 'vitest'
import { isClassSelection } from '../isClassSelection'

describe('isClassSelection', () => {
  it('returns true for a valid class selection', () => {
    expect(
      isClassSelection({
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
        },
      }),
    ).toBe(true)
  })

  it('returns false for invalid levels or choice shapes', () => {
    expect(
      isClassSelection({
        classId: 'srd-2024:fighter',
        level: 0,
        choices: {},
      }),
    ).toBe(false)

    expect(
      isClassSelection({
        classId: 'srd-2024:fighter',
        level: 1,
        choices: { 'skill-proficiencies': 2 },
      }),
    ).toBe(false)
  })
})
