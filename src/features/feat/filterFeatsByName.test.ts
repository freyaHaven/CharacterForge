import { describe, expect, it } from 'vitest'
import { SRD_2024_FEATS } from '../../data/feats/srd-2024/source'
import { filterFeatsByName } from './filterFeatsByName'

describe('filterFeatsByName', () => {
  it('returns all feats for an empty query', () => {
    expect(filterFeatsByName([...SRD_2024_FEATS], '')).toHaveLength(
      SRD_2024_FEATS.length,
    )
  })

  it('filters by feat name', () => {
    expect(
      filterFeatsByName([...SRD_2024_FEATS], 'alert').map((feat) => feat.id),
    ).toEqual(['srd-2024:alert'])
  })

  it('filters by category label text', () => {
    expect(
      filterFeatsByName([...SRD_2024_FEATS], 'origin').map((feat) => feat.id),
    ).toEqual(SRD_2024_FEATS.map((feat) => feat.id))
  })
})
