import { describe, expect, it } from 'vitest'
import { hunterSrd2024 } from '../hunter'

describe('hunterSrd2024', () => {
  it('uses stable ids linked to Ranger', () => {
    expect(hunterSrd2024.id).toBe('srd-2024:hunter')
    expect(hunterSrd2024.classId).toBe('srd-2024:ranger')
    expect(hunterSrd2024.choiceOptionId).toBe('hunter')
  })

  it('grants features at Hunter levels', () => {
    expect(hunterSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 3, 7, 11, 15,
    ])
  })
})
