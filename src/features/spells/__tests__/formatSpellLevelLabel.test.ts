import { describe, expect, it } from 'vitest'
import { formatSpellLevelLabel } from '../formatSpellLevelLabel'

describe('formatSpellLevelLabel', () => {
  it('labels cantrips and ordinal levels', () => {
    expect(formatSpellLevelLabel(0)).toBe('Cantrip')
    expect(formatSpellLevelLabel(1)).toBe('1st-level')
    expect(formatSpellLevelLabel(2)).toBe('2nd-level')
    expect(formatSpellLevelLabel(3)).toBe('3rd-level')
    expect(formatSpellLevelLabel(5)).toBe('5th-level')
  })
})
