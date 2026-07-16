import { describe, expect, it } from 'vitest'
import { buildAbilityScoreBreakdown } from '../resolveAbilityScoreBreakdown'

describe('buildAbilityScoreBreakdown', () => {
  it('keeps unassigned bases empty and totals null', () => {
    const [strength] = buildAbilityScoreBreakdown({
      baseScores: {
        strength: null,
        dexterity: null,
        constitution: null,
        intelligence: null,
        wisdom: null,
        charisma: null,
      },
    })

    expect(strength).toMatchObject({
      abilityKey: 'strength',
      baseScore: null,
      totalScore: null,
      modifier: null,
      bonuses: [],
    })
  })

  it('adds background bonuses into the displayed total', () => {
    const [strength] = buildAbilityScoreBreakdown({
      baseScores: { strength: 15 },
      bonuses: {
        strength: [{ amount: 1, sourceLabel: 'Soldier' }],
      },
    })

    expect(strength).toMatchObject({
      baseScore: 15,
      totalScore: 16,
      modifier: 3,
      bonuses: [{ amount: 1, sourceLabel: 'Soldier' }],
    })
  })
})
