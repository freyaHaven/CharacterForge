import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { formatHitDie } from '../formatClassDetails'

describe('formatHitDie', () => {
  it('includes the class level in the hit die pool', () => {
    expect(formatHitDie(fighterSrd2024)).toBe('1d10')
    expect(formatHitDie(fighterSrd2024, 1)).toBe('1d10')
    expect(formatHitDie(fighterSrd2024, 5)).toBe('5d10')
    expect(formatHitDie(fighterSrd2024, 20)).toBe('20d10')
  })
})
