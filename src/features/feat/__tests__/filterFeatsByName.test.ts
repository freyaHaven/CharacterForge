import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import { filterFeatsByName } from '../filterFeatsByName'

describe('filterFeatsByName', () => {
  it('returns all feats for an empty query', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')

    expect(filterFeatsByName(feats, '')).toHaveLength(feats.length)
  })

  it('matches by name case-insensitively', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')

    expect(filterFeatsByName(feats, 'alert').map((feat) => feat.id)).toEqual([
      'srd-2024:alert',
    ])
  })

  it('matches origin category text for the current catalogue', async () => {
    const feats = await createBundledFeatCatalog().listFeats('srd-2024')

    expect(filterFeatsByName(feats, 'origin').map((feat) => feat.id)).toEqual([
      'srd-2024:alert',
      'srd-2024:magic-initiate-cleric',
      'srd-2024:magic-initiate-druid',
      'srd-2024:magic-initiate-wizard',
      'srd-2024:savage-attacker',
      'srd-2024:skilled',
    ])
  })
})
