import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import {
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from './featureProgression'

describe('class feature progression', () => {
  it('returns features for a specific level from edition data', () => {
    const levelOneFeatures = getClassFeaturesForLevel(fighterSrd2024, 1)

    expect(levelOneFeatures.map((feature) => feature.id)).toEqual([
      'fighting-style',
      'second-wind',
      'weapon-mastery',
    ])
  })

  it('returns cumulative features up to the selected level', () => {
    expect(getClassFeaturesUpToLevel(fighterSrd2024, 1)).toHaveLength(3)
    expect(getClassFeaturesUpToLevel(fighterSrd2024, 2)).toHaveLength(3)
  })
})
