import { describe, expect, it } from 'vitest'
import {
  getAllocatedLevel,
  getEffectiveClassesForAllocation,
  getEffectiveClassesForCharacterAllocation,
  getMaxLevelForInstance,
  getRemainingLevels,
  hasUniqueClassIds,
} from '../classLevels'

describe('classLevels', () => {
  it('sums allocated levels across class instances', () => {
    expect(
      getAllocatedLevel([
        {
          instanceId: 'a',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
        },
        {
          instanceId: 'b',
          classId: 'srd-2024:rogue',
          level: 2,
          choices: {},
        },
      ]),
    ).toBe(5)
  })

  it('returns remaining levels against the target level', () => {
    expect(
      getRemainingLevels(5, [
        {
          instanceId: 'a',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
        },
      ]),
    ).toBe(2)
  })

  it('rejects duplicate class ids', () => {
    expect(
      hasUniqueClassIds([
        {
          instanceId: 'a',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
        {
          instanceId: 'b',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ]),
    ).toBe(false)
  })

  it('includes every instance draft when computing allocation totals', () => {
    expect(
      getEffectiveClassesForCharacterAllocation(
        [
          {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 1,
            choices: {},
          },
        ],
        {
          fighter: {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {},
          },
        },
      ),
    ).toEqual([
      {
        instanceId: 'fighter',
        classId: 'srd-2024:fighter',
        level: 3,
        choices: {},
      },
    ])
  })

  it('includes the active draft when computing allocation totals', () => {
    expect(
      getEffectiveClassesForAllocation(
        [
          {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {},
          },
        ],
        'barbarian',
        {
          classId: 'srd-2024:barbarian',
          level: 1,
          choices: {},
        },
      ),
    ).toEqual([
      {
        instanceId: 'fighter',
        classId: 'srd-2024:fighter',
        level: 3,
        choices: {},
      },
      {
        instanceId: 'barbarian',
        classId: 'srd-2024:barbarian',
        level: 1,
        choices: {},
      },
    ])
  })

  it('caps per-instance level increases by remaining target levels', () => {
    expect(
      getMaxLevelForInstance(
        5,
        [
          {
            instanceId: 'fighter',
            classId: 'srd-2024:fighter',
            level: 3,
            choices: {},
          },
        ],
        'barbarian',
        {
          classId: 'srd-2024:barbarian',
          level: 1,
          choices: {},
        },
      ),
    ).toBe(2)
  })
})
