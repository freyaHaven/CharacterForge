import { describe, expect, it } from 'vitest'
import {
  formatSignedModifier,
  getPassiveScore,
  getProficiencyBonus,
  getSavingThrowModifier,
  getSkillModifier,
} from './sheetMechanics'

describe('sheetMechanics', () => {
  it('maps proficiency bonus by character level', () => {
    expect(getProficiencyBonus(1)).toBe(2)
    expect(getProficiencyBonus(4)).toBe(2)
    expect(getProficiencyBonus(5)).toBe(3)
    expect(getProficiencyBonus(20)).toBe(6)
  })

  it('formats signed modifiers and computes skill, save, and passive values', () => {
    expect(formatSignedModifier(3)).toBe('+3')
    expect(formatSignedModifier(0)).toBe('+0')
    expect(formatSignedModifier(-1)).toBe('-1')

    expect(getSkillModifier(16, 2, 'none')).toBe(3)
    expect(getSkillModifier(16, 2, 'proficient')).toBe(5)
    expect(getSkillModifier(16, 2, 'expertise')).toBe(7)

    expect(getSavingThrowModifier(14, 2, false)).toBe(2)
    expect(getSavingThrowModifier(14, 2, true)).toBe(4)

    expect(getPassiveScore(3)).toBe(13)
  })
})
