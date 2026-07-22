import { describe, expect, it } from 'vitest'
import {
  ELDRITCH_INVOCATION_OPTIONS,
  SRD_ELDRITCH_INVOCATION_BASE_IDS,
} from '../eldritchInvocations'
import {
  isClassChoiceOptionEligible,
  matchesRequiredOptionId,
} from '../../../../../domain/class/classOptionPrerequisites'

describe('eldritch invocations', () => {
  it('covers all 27 SRD base invocations', () => {
    expect(SRD_ELDRITCH_INVOCATION_BASE_IDS).toHaveLength(27)
    for (const baseId of SRD_ELDRITCH_INVOCATION_BASE_IDS) {
      expect(
        ELDRITCH_INVOCATION_OPTIONS.some((option) => option.id === baseId),
      ).toBe(true)
    }
  })

  it('marks blast and Lessons invocations as repeatable with numbered copies', () => {
    for (const baseId of [
      'agonizing-blast',
      'eldritch-spear',
      'repelling-blast',
      'lessons-of-the-first-ones',
    ] as const) {
      expect(
        ELDRITCH_INVOCATION_OPTIONS.some(
          (option) => option.id === `${baseId}-2`,
        ),
      ).toBe(true)
      expect(
        ELDRITCH_INVOCATION_OPTIONS.some(
          (option) => option.id === `${baseId}-3`,
        ),
      ).toBe(true)
    }
  })

  it('treats pact-of-the-blade numbered ids as matching the base prerequisite', () => {
    expect(matchesRequiredOptionId('pact-of-the-blade', 'pact-of-the-blade')).toBe(
      true,
    )
    expect(
      matchesRequiredOptionId('pact-of-the-blade-2', 'pact-of-the-blade'),
    ).toBe(true)
    expect(
      matchesRequiredOptionId('pact-of-the-tome', 'pact-of-the-blade'),
    ).toBe(false)
  })

  it('attaches Tome spell entitlements on Pact of the Tome', () => {
    const tome = ELDRITCH_INVOCATION_OPTIONS.find(
      (option) => option.id === 'pact-of-the-tome',
    )
    expect(tome?.spellEntitlements?.map((entry) => entry.id)).toEqual([
      'pact-of-the-tome-cantrips',
      'pact-of-the-tome-rituals',
    ])
  })

  it('requires Thirsting Blade for Devouring Blade', () => {
    const devouring = ELDRITCH_INVOCATION_OPTIONS.find(
      (option) => option.id === 'devouring-blade',
    )!
    expect(
      isClassChoiceOptionEligible(devouring, {
        sourceLevel: 12,
        selectedChoices: {
          'eldritch-invocations': ['thirsting-blade', 'pact-of-the-blade'],
        },
      }),
    ).toBe(true)
    expect(
      isClassChoiceOptionEligible(devouring, {
        sourceLevel: 12,
        selectedChoices: {
          'eldritch-invocations': ['pact-of-the-blade'],
        },
      }),
    ).toBe(false)
  })
})
