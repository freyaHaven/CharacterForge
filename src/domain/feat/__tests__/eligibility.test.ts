import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { evaluateFeatEligibility } from '../eligibility'

describe('evaluateFeatEligibility', () => {
  it('treats none prerequisites as eligible', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')
    expect(alert).not.toBeNull()
    expect(evaluateFeatEligibility(alert!)).toEqual({ eligible: true })
  })
})
