import { describe, expect, it } from 'vitest'
import { createSyntheticClassDefinition } from '../../testing/syntheticClassDefinition'
import {
  getClassFeatureProgressionUpToLevel,
  getClassFeaturesForLevel,
  getClassFeaturesUpToLevel,
} from './featureProgression'

const sampleClass = createSyntheticClassDefinition()

describe('class feature progression', () => {
  it('returns features for a specific level from definition data', () => {
    const levelOneFeatures = getClassFeaturesForLevel(sampleClass, 1)

    expect(levelOneFeatures.map((feature) => feature.id)).toEqual([
      'sample-feature',
    ])
  })

  it('returns cumulative features up to the selected level', () => {
    expect(getClassFeaturesUpToLevel(sampleClass, 1)).toHaveLength(1)
    expect(getClassFeaturesUpToLevel(sampleClass, 3)).toHaveLength(2)
  })

  it('returns level-banded progression up to the selected level', () => {
    expect(getClassFeatureProgressionUpToLevel(sampleClass, 3)).toEqual([
      expect.objectContaining({ level: 1 }),
      expect.objectContaining({ level: 3 }),
    ])
  })
})
