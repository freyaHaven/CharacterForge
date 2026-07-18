import { describe, expect, it } from 'vitest'
import { lifeDomainSrd2024 } from '../life-domain'

describe('lifeDomainSrd2024', () => {
  it('uses stable ids linked to Cleric', () => {
    expect(lifeDomainSrd2024.id).toBe('srd-2024:life-domain')
    expect(lifeDomainSrd2024.classId).toBe('srd-2024:cleric')
    expect(lifeDomainSrd2024.choiceOptionId).toBe('life-domain')
  })

  it('grants features at Life Domain levels', () => {
    expect(lifeDomainSrd2024.features.map((feature) => feature.level)).toEqual([
      3, 3, 3, 6, 17,
    ])
  })
})
