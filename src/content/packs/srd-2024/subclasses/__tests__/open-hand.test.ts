import { describe, expect, it } from 'vitest'
import { openHandSrd2024 } from '../open-hand'

describe('openHandSrd2024', () => {
  it('targets the Monk class with stable option id', () => {
    expect(openHandSrd2024.id).toBe('srd-2024:warrior-of-the-open-hand')
    expect(openHandSrd2024.classId).toBe('srd-2024:monk')
    expect(openHandSrd2024.choiceOptionId).toBe('warrior-of-the-open-hand')
  })

  it('grants features at Open Hand levels 3, 6, 11, and 17', () => {
    expect(openHandSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 6, 11, 17,
    ])
  })
})
