import { describe, expect, it } from 'vitest'
import {
  formatRemainingStandardArrayValues,
  getRemainingStandardArrayValues,
} from './standardArrayRemaining'
import {
  createEmptyStandardArrayDraft,
  defaultStandardArrayDraft,
} from './standardArrayDraft'

describe('getRemainingStandardArrayValues', () => {
  it('updates remaining values after an assignment', () => {
    const draft = createEmptyStandardArrayDraft()
    draft.strength = 15

    expect(getRemainingStandardArrayValues(draft)).toEqual([14, 13, 12, 10, 8])
    expect(formatRemainingStandardArrayValues(
      getRemainingStandardArrayValues(draft),
    )).toBe('14, 13, 12, 10, 8')
  })

  it('does not show a duplicated assigned value in remaining values', () => {
    const draft = defaultStandardArrayDraft()
    draft.dexterity = 15

    expect(getRemainingStandardArrayValues(draft)).toEqual([14])
  })

  it('returns none when the draft is a complete valid assignment', () => {
    expect(getRemainingStandardArrayValues(defaultStandardArrayDraft())).toEqual(
      [],
    )
    expect(
      formatRemainingStandardArrayValues(
        getRemainingStandardArrayValues(defaultStandardArrayDraft()),
      ),
    ).toBe('None')
  })
})

describe('standard array draft helpers', () => {
  it('clears every draft ability to null', () => {
    expect(createEmptyStandardArrayDraft()).toEqual({
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    })
  })

  it('restores a valid complete assignment from the default draft', () => {
    expect(defaultStandardArrayDraft()).toEqual({
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    })
  })
})
