import { describe, expect, it } from 'vitest'
import { devotionSrd2024 } from '../devotion'

describe('devotionSrd2024', () => {
  it('targets the Paladin class with stable option id', () => {
    expect(devotionSrd2024.id).toBe('srd-2024:oath-of-devotion')
    expect(devotionSrd2024.classId).toBe('srd-2024:paladin')
    expect(devotionSrd2024.choiceOptionId).toBe('oath-of-devotion')
  })

  it('grants features at Devotion levels 3, 7, 15, and 20', () => {
    expect(devotionSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 3, 7, 15, 20,
    ])
  })
})
