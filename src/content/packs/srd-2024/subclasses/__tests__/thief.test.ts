import { describe, expect, it } from 'vitest'
import { thiefSrd2024 } from '../thief'

describe('thiefSrd2024', () => {
  it('targets the Rogue class with stable option id', () => {
    expect(thiefSrd2024.id).toBe('srd-2024:thief')
    expect(thiefSrd2024.classId).toBe('srd-2024:rogue')
    expect(thiefSrd2024.choiceOptionId).toBe('thief')
  })

  it('grants features at Thief levels 3, 9, 13, and 17', () => {
    expect(thiefSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 3, 9, 13, 17,
    ])
  })
})
