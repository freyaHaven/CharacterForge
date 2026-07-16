import { describe, expect, it } from 'vitest'
import { createSyntheticClassDefinition } from '../../../testing/syntheticClassDefinition'
import {
  getChoicesAvailableAtLevel,
  pruneClassChoicesForLevel,
} from '../choiceAvailability'

const sampleClass = createSyntheticClassDefinition()

describe('choiceAvailability', () => {
  it('returns only choices at or below the selected level', () => {
    expect(
      getChoicesAvailableAtLevel(sampleClass, 1).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies'])

    expect(
      getChoicesAvailableAtLevel(sampleClass, 3).map((choice) => choice.id),
    ).toEqual(['skill-proficiencies', 'sample-subclass'])
  })

  it('prunes choices that are no longer available while preserving others', () => {
    const pruned = pruneClassChoicesForLevel(
      {
        'skill-proficiencies': ['athletics', 'perception'],
        'sample-subclass': 'path-a',
      },
      getChoicesAvailableAtLevel(sampleClass, 1),
    )

    expect(pruned).toEqual({
      'skill-proficiencies': ['athletics', 'perception'],
    })
  })
})
