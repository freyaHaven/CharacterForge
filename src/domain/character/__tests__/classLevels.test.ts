import { describe, expect, it } from 'vitest'
import {
  getAllocatedLevel,
  getClassInstancesForHitPoints,
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

  describe('getClassInstancesForHitPoints', () => {
    it('ignores a foreign replacement draft while a class is committed', () => {
      const committed = [
        {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 5,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' as const },
            { classLevel: 2, method: 'fixed' as const },
            { classLevel: 3, method: 'fixed' as const },
            { classLevel: 4, method: 'fixed' as const },
            { classLevel: 5, method: 'fixed' as const },
          ],
        },
      ]

      expect(
        getClassInstancesForHitPoints(committed, {
          rogue: {
            instanceId: 'rogue',
            classId: 'srd-2024:rogue',
            level: 1,
            choices: {},
            hitPointIncreases: [{ classLevel: 1, method: 'max' }],
          },
        }),
      ).toEqual(committed)
    })

    it('overlays same-instance same-classId draft level and HP fields', () => {
      const committed = [
        {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
          hitPointIncreases: [{ classLevel: 1, method: 'max' as const }],
        },
      ]

      const result = getClassInstancesForHitPoints(committed, {
        fighter: {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
          hitPointIncreases: [
            { classLevel: 1, method: 'max' },
            { classLevel: 2, method: 'fixed' },
            { classLevel: 3, method: 'roll', rolledValue: 8 },
          ],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.level).toBe(3)
      expect(result[0]?.hitPointIncreases).toEqual([
        { classLevel: 1, method: 'max' },
        { classLevel: 2, method: 'fixed' },
        { classLevel: 3, method: 'roll', rolledValue: 8 },
      ])
    })

    it('does not overlay a same-instance draft that changed classId', () => {
      const committed = [
        {
          instanceId: 'instance-1',
          classId: 'srd-2024:fighter',
          level: 5,
          choices: {},
        },
      ]

      expect(
        getClassInstancesForHitPoints(committed, {
          'instance-1': {
            instanceId: 'instance-1',
            classId: 'srd-2024:rogue',
            level: 1,
            choices: {},
          },
        }),
      ).toEqual(committed)
    })

    it('excludes an uncommitted multiclass draft from HP contribution', () => {
      const committed = [
        {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 3,
          choices: {},
        },
      ]

      expect(
        getClassInstancesForHitPoints(committed, {
          rogue: {
            instanceId: 'rogue',
            classId: 'srd-2024:rogue',
            level: 2,
            choices: {},
          },
        }),
      ).toEqual(committed)
    })

    it('allows draft HP preview when no class is committed yet', () => {
      const result = getClassInstancesForHitPoints([], {
        fighter: {
          instanceId: 'fighter',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.classId).toBe('srd-2024:fighter')
    })
  })
})
