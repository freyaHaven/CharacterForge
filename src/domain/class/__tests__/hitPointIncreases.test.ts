import { describe, expect, it } from 'vitest'
import {
  getFixedHitDieValue,
  syncHitPointIncreases,
  updateHitPointIncrease,
} from '../hitPointIncreases'

describe('hitPointIncreases', () => {
  it('computes fixed averages for standard hit dice', () => {
    expect(getFixedHitDieValue(6)).toBe(4)
    expect(getFixedHitDieValue(8)).toBe(5)
    expect(getFixedHitDieValue(10)).toBe(6)
    expect(getFixedHitDieValue(12)).toBe(7)
  })

  it('syncs increases for a starting class', () => {
    expect(syncHitPointIncreases(undefined, 3, { isStartingClass: true })).toEqual([
      { classLevel: 1, method: 'max' },
      { classLevel: 2, method: 'fixed' },
      { classLevel: 3, method: 'fixed' },
    ])
  })

  it('preserves rolled values when syncing', () => {
    const synced = syncHitPointIncreases(
      [
        { classLevel: 1, method: 'max' },
        { classLevel: 2, method: 'roll', rolledValue: 8 },
      ],
      3,
      { isStartingClass: true },
    )

    expect(synced).toEqual([
      { classLevel: 1, method: 'max' },
      { classLevel: 2, method: 'roll', rolledValue: 8 },
      { classLevel: 3, method: 'fixed' },
    ])
  })

  it('updates a level method and clears roll when switching to fixed', () => {
    expect(
      updateHitPointIncrease(
        [
          { classLevel: 1, method: 'max' },
          { classLevel: 2, method: 'roll', rolledValue: 9 },
        ],
        2,
        { method: 'fixed' },
      ),
    ).toEqual([
      { classLevel: 1, method: 'max' },
      { classLevel: 2, method: 'fixed' },
    ])
  })
})
