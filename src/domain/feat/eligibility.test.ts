import { describe, expect, it } from 'vitest'
import { alertSrd2024 } from '../../data/feats/srd-2024/alert'
import {
  evaluateFeatEligibility,
  formatFeatPrerequisite,
} from './eligibility'

describe('feat eligibility', () => {
  it('treats feats with no prerequisite as eligible', () => {
    expect(evaluateFeatEligibility(alertSrd2024)).toEqual({ eligible: true })
  })

  it('formats prerequisite labels for cards and details', () => {
    expect(formatFeatPrerequisite({ kind: 'none' })).toBe('None')
    expect(
      formatFeatPrerequisite({
        kind: 'text',
        summary: 'Strength 13 or higher',
      }),
    ).toBe('Strength 13 or higher')
  })
})
