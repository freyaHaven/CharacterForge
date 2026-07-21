import { describe, expect, it } from 'vitest'
import {
  evaluateFeatEligibility,
  type FeatEligibilityContext,
} from '../eligibility'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'

const baseContext: FeatEligibilityContext = {
  characterLevel: 19,
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 10,
  },
  hasSpellcasting: false,
  hasFightingStyle: true,
  takenFeatIds: [],
}

describe('evaluateFeatEligibility', () => {
  it('treats none prerequisites as eligible', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')
    expect(alert).not.toBeNull()
    expect(evaluateFeatEligibility(alert!, baseContext)).toEqual({
      eligible: true,
    })
  })

  it('requires level 19 and spellcasting for Boon of Spell Recall', async () => {
    const boon = await createBundledFeatCatalog().getFeat(
      'srd-2024:boon-of-spell-recall',
    )
    expect(boon).not.toBeNull()

    expect(
      evaluateFeatEligibility(boon!, {
        ...baseContext,
        hasSpellcasting: false,
      }).eligible,
    ).toBe(false)

    expect(
      evaluateFeatEligibility(boon!, {
        ...baseContext,
        hasSpellcasting: true,
      }),
    ).toEqual({ eligible: true })
  })

  it('enforces Grappler ability score prerequisites', async () => {
    const grappler = await createBundledFeatCatalog().getFeat('srd-2024:grappler')
    expect(grappler).not.toBeNull()

    expect(
      evaluateFeatEligibility(grappler!, {
        ...baseContext,
        characterLevel: 4,
        abilityScores: {
          ...baseContext.abilityScores,
          strength: 10,
          dexterity: 10,
        },
      }).eligible,
    ).toBe(false)

    expect(
      evaluateFeatEligibility(grappler!, {
        ...baseContext,
        characterLevel: 4,
        abilityScores: {
          ...baseContext.abilityScores,
          strength: 13,
          dexterity: 10,
        },
      }),
    ).toEqual({ eligible: true })
  })

  it('blocks non-repeatable duplicates via takenFeatIds', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')
    expect(alert).not.toBeNull()

    expect(
      evaluateFeatEligibility(alert!, {
        ...baseContext,
        takenFeatIds: ['srd-2024:alert'],
      }),
    ).toEqual({
      eligible: false,
      reason: 'You already have this feat',
    })
  })
})
