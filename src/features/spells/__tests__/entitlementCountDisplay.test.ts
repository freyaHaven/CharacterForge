import { describe, expect, it } from 'vitest'
import {
  buildEntitlementCountDisplay,
  formatLevelCountValue,
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

  it('expands a per-level table when multiple levels are available', () => {
    const display = buildEntitlementCountDisplay({
      entitlementLabel: 'Prepared Spells',
      limit: 5,
      accessibleLevels: [1, 2],
      spellLevelById,
      selectedSpellIds: ['a', 'b', 'c'],
      slotsByLevel: [3, 2],
    })

    expect(display.countLabel).toBe('3/5')
    expect(display.levelRows).toEqual([
      { level: 1, label: '1st level', selected: 2, capacity: 3 },
      { level: 2, label: '2nd level', selected: 1, capacity: 2 },
    ])
    expect(display.levelRows.map(formatLevelCountValue)).toEqual(['2/3', '1/2'])
  })
})
