import { describe, expect, it } from 'vitest'
import { canSaveCharacter, formatSaveBlockedMessage } from '../characterSavePolicy'

const completeDraftFlags = {
  speciesDraftIncomplete: false,
  classDraftIncomplete: false,
  backgroundDraftIncomplete: false,
  featDraftIncomplete: false,
} as const

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
        ...completeDraftFlags,
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
        ...completeDraftFlags,
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
        ...completeDraftFlags,
      }),
    ).toBe(false)
  })

  it('allows saving for a complete rolled assignment', () => {
    expect(
      canSaveCharacter('rolled', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: { valid: true },
        ...completeDraftFlags,
      }),
    ).toBe(true)
  })

  it('blocks saving while a species draft is incomplete', () => {
    expect(
      canSaveCharacter('manual', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: null,
        ...completeDraftFlags,
        speciesDraftIncomplete: true,
      }),
    ).toBe(false)
  })

  it('blocks saving while a class draft is incomplete', () => {
    expect(
      canSaveCharacter('manual', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: null,
        ...completeDraftFlags,
        classDraftIncomplete: true,
      }),
    ).toBe(false)
  })

  it('blocks saving while a background draft is incomplete', () => {
    expect(
      canSaveCharacter('manual', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: null,
        ...completeDraftFlags,
        backgroundDraftIncomplete: true,
      }),
    ).toBe(false)
  })

  it('blocks saving while a feat draft is incomplete', () => {
    expect(
      canSaveCharacter('manual', {
        standardArrayValidation: null,
        pointBuyValidation: null,
        rolledValidation: null,
        ...completeDraftFlags,
        featDraftIncomplete: true,
      }),
    ).toBe(false)
  })
})

describe('formatSaveBlockedMessage', () => {
  it('returns species-specific guidance when a draft is incomplete', () => {
    expect(formatSaveBlockedMessage('manual', true, false, false, false)).toBe(
      'Complete the species selection before saving.',
    )
  })

  it('returns class-specific guidance when a class draft is incomplete', () => {
    expect(formatSaveBlockedMessage('manual', false, true, false, false)).toBe(
      'Complete the class selection before saving.',
    )
  })

  it('returns background-specific guidance when a background draft is incomplete', () => {
    expect(formatSaveBlockedMessage('manual', false, false, true, false)).toBe(
      'Complete the background selection before saving.',
    )
  })

  it('returns feat-specific guidance when a feat draft is incomplete', () => {
    expect(formatSaveBlockedMessage('manual', false, false, false, true)).toBe(
      'Complete the feat selection before saving.',
    )
  })

  it('returns creation-method-specific guidance for ability score drafts', () => {
    expect(formatSaveBlockedMessage('point-buy', false, false, false, false)).toBe(
      'Fix the point-buy assignment before saving.',
    )
    expect(formatSaveBlockedMessage('rolled', false, false, false, false)).toBe(
      'Complete the rolled assignment before saving.',
    )
    expect(
      formatSaveBlockedMessage('standard-array', false, false, false, false),
    ).toBe('Complete the standard array assignment before saving.')
  })
})
