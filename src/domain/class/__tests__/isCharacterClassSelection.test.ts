import { describe, expect, it } from 'vitest'
import { isCharacterClassSelection } from '../isCharacterClassSelection'

describe('isCharacterClassSelection', () => {
  it('returns true for a valid class instance', () => {
    expect(
      isCharacterClassSelection({
        instanceId: 'instance-1',
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {},
      }),
    ).toBe(true)
  })

  it('returns false when instanceId is missing', () => {
    expect(
      isCharacterClassSelection({
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {},
      }),
    ).toBe(false)
  })
})
