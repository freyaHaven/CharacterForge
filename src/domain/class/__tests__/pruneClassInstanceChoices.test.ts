import { describe, expect, it } from 'vitest'
import { createSyntheticClassDefinition } from '../../../testing/syntheticClassDefinition'
import { pruneClassInstanceChoicesForLevel } from '../pruneClassInstanceChoices'

const sampleClass = createSyntheticClassDefinition()

describe('pruneClassInstanceChoicesForLevel', () => {
  it('lowers one instance without changing another', () => {
    const primary = {
      instanceId: 'primary-1',
      classId: 'test:sample-class',
      level: 5,
      choices: {
        'skill-proficiencies': ['athletics', 'perception'],
        'sample-subclass': 'path-a',
      },
    }
    const secondary = {
      instanceId: 'secondary-1',
      classId: 'test:other-class',
      level: 2,
      choices: {
        'skill-proficiencies': ['survival', 'athletics'],
      },
    }

    const prunedPrimary = pruneClassInstanceChoicesForLevel(
      primary,
      sampleClass,
      1,
    )

    expect(prunedPrimary.instanceId).toBe('primary-1')
    expect(prunedPrimary.level).toBe(1)
    expect(prunedPrimary.choices).toEqual({
      'skill-proficiencies': ['athletics', 'perception'],
    })
    expect(secondary).toEqual({
      instanceId: 'secondary-1',
      classId: 'test:other-class',
      level: 2,
      choices: {
        'skill-proficiencies': ['survival', 'athletics'],
      },
    })
  })

  it('removes subclass choice when lowering below subclass level', () => {
    const primary = {
      instanceId: 'primary-1',
      classId: 'test:sample-class',
      level: 5,
      choices: {
        'skill-proficiencies': ['athletics', 'perception'],
        'sample-subclass': 'path-a',
      },
    }

    expect(
      pruneClassInstanceChoicesForLevel(primary, sampleClass, 2).choices,
    ).toEqual({
      'skill-proficiencies': ['athletics', 'perception'],
    })
  })
})
