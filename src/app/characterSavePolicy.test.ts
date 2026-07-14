import { describe, expect, it } from 'vitest'
import { canSaveCharacter } from './characterSavePolicy'

describe('canSaveCharacter', () => {
  it('blocks saving for an invalid point-buy draft', () => {
    expect(
      canSaveCharacter('point-buy', {
        standardArrayValidation: null,
        pointBuyValidation: {
          valid: false,
          issues: [{ code: 'over-budget', spent: 54, budget: 27 }],
          spent: 54,
          remaining: -27,
        },
        rolledValidation: null,
        speciesDraftIncomplete: false,
      }),
    ).toBe(false)
  })

  it('allows saving for a valid point-buy draft with unspent points', () => {
    expect(
      canSaveCharacter('point-buy', {
        standardArrayValidation: null,
        pointBuyValidation: {
          valid: true,
          spent: 0,
          remaining: 27,
        },
        rolledValidation: null,
        speciesDraftIncomplete: false,
      }),
    ).toBe(true)
  })

  it('blocks saving for an incomplete rolled assignment', () => {
    expect(
      canSaveCharacter('rolled', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: {
          valid: false,
          issues: [{ code: 'unassigned-ability', ability: 'strength' }],
        },
        speciesDraftIncomplete: false,
      }),
    ).toBe(false)
  })

  it('allows saving for a complete rolled assignment', () => {
    expect(
      canSaveCharacter('rolled', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: { valid: true },
        speciesDraftIncomplete: false,
      }),
    ).toBe(true)
  })

  it('blocks saving while a species draft is incomplete', () => {
    expect(
      canSaveCharacter('manual', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: null,
        speciesDraftIncomplete: true,
      }),
    ).toBe(false)
  })
})
