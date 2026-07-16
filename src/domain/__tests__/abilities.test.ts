import { describe, expect, it } from 'vitest'
import { getAbilityModifier } from '../abilities'

describe('getAbilityModifier', () => {
  it.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [18, 4],
    [20, 5],
  ])('score %i returns modifier %i', (score, modifier) => {
    expect(getAbilityModifier(score)).toBe(modifier)
  })
})
