import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import {
  getClassFeatureProgressionUpToLevel,
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
    expect(getClassFeaturesUpToLevel(fighterSrd2024, 3)).toHaveLength(4)
    expect(getClassFeaturesUpToLevel(fighterSrd2024, 5)).toHaveLength(5)
  })

  it('returns level-banded progression up to the selected level', () => {
    expect(getClassFeatureProgressionUpToLevel(fighterSrd2024, 5)).toEqual([
      expect.objectContaining({ level: 1 }),
      expect.objectContaining({ level: 3 }),
      expect.objectContaining({ level: 5 }),
    ])
  })
})
