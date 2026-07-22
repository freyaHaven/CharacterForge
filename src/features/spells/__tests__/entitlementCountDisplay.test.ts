import { describe, expect, it } from 'vitest'
import {
  buildEntitlementCountDisplay,
  formatLevelCountValue,
  formatSpellLevelAccordionSummary,
  formatSpellLevelBandLabel,
} from '../entitlementCountDisplay'

describe('formatSpellLevelBandLabel', () => {
  it('uses hierarchy-friendly band labels', () => {
    expect(formatSpellLevelBandLabel(0)).toBe('Cantrips')
    expect(formatSpellLevelBandLabel(1)).toBe('1st level')
    expect(formatSpellLevelBandLabel(2)).toBe('2nd level')
    expect(formatSpellLevelBandLabel(3)).toBe('3rd level')
    expect(formatSpellLevelBandLabel(5)).toBe('5th level')
  })
})

describe('buildEntitlementCountDisplay', () => {
  const spellLevelById = new Map([
    ['a', 1],
    ['b', 1],
    ['c', 2],
  ])

  it('inlines the only accessible level into the count label', () => {
    expect(
      buildEntitlementCountDisplay({
        entitlementLabel: 'Prepared Spells',
        limit: 2,
        accessibleLevels: [1],
        spellLevelById,
        selectedSpellIds: [],
      }),
    ).toEqual({
      countLabel: '0/2 (1st level)',
      levelRows: [],
    })
  })

  it('does not restate cantrips in parentheses when the title is already Cantrips', () => {
    expect(
      buildEntitlementCountDisplay({
        entitlementLabel: 'Cantrips',
        limit: 3,
        accessibleLevels: [0],
        spellLevelById: new Map(),
        selectedSpellIds: [],
      }),
    ).toEqual({
      countLabel: '0/3',
      levelRows: [],
    })
  })

  it('expands entitlement-scoped level rows without slot-style /N denominators', () => {
    const display = buildEntitlementCountDisplay({
      entitlementLabel: 'Prepared Spells',
      limit: 5,
      accessibleLevels: [1, 2],
      spellLevelById,
      selectedSpellIds: ['a', 'b', 'c'],
    })

    expect(display.countLabel).toBe('3/5')
    expect(display.levelRows).toEqual([
      {
        level: 1,
        label: '1st level',
        selected: 2,
        capacity: null,
        limitScope: 'entitlement',
      },
      {
        level: 2,
        label: '2nd level',
        selected: 1,
        capacity: null,
        limitScope: 'entitlement',
      },
    ])
    expect(display.levelRows.map(formatLevelCountValue)).toEqual([
      '2 selected',
      '1 selected',
    ])
  })

  it('shows genuine per-group limits when provided', () => {
    const display = buildEntitlementCountDisplay({
      entitlementLabel: 'Special Picks',
      limit: 3,
      accessibleLevels: [1, 2],
      spellLevelById,
      selectedSpellIds: ['a', 'c'],
      groupLimitsByLevel: new Map([
        [1, 1],
        [2, 2],
      ]),
    })

    expect(display.levelRows.map(formatLevelCountValue)).toEqual(['1/1', '1/2'])
    expect(display.levelRows.every((row) => row.limitScope === 'group')).toBe(
      true,
    )
  })
})

describe('formatSpellLevelAccordionSummary', () => {
  it('describes empty, selected, and exhausted partitions', () => {
    expect(
      formatSpellLevelAccordionSummary({
        label: '1st level',
        selectedNames: [],
        eligibleCount: 4,
      }),
    ).toBe('Browse 1st-level spells')

    expect(
      formatSpellLevelAccordionSummary({
        label: '2nd level',
        selectedNames: ['Blur', 'Misty Step'],
        eligibleCount: 2,
      }),
    ).toBe('Blur, Misty Step')

    expect(
      formatSpellLevelAccordionSummary({
        label: '3rd level',
        selectedNames: ['Fireball', 'Counterspell', 'Fly'],
        eligibleCount: 1,
      }),
    ).toBe('3 selected')

    expect(
      formatSpellLevelAccordionSummary({
        label: '1st level',
        selectedNames: [],
        eligibleCount: 0,
      }),
    ).toBe('No additional spells available')
  })
})
