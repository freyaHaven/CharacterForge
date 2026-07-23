import { describe, expect, it } from 'vitest'
import {
  formatSelectionProgress,
  formatSpellSectionTitle,
  resolveSpellSectionDefaultExpanded,
  shouldCollapseSpellSection,
} from '../spellSectionCollapse'

describe('spellSectionCollapse', () => {
  it('collapses only when the catalogue exceeds the threshold', () => {
    expect(shouldCollapseSpellSection(3)).toBe(false)
    expect(shouldCollapseSpellSection(4)).toBe(true)
  })

  it('defaults granted sections closed', () => {
    expect(
      resolveSpellSectionDefaultExpanded({
        kind: 'granted',
        itemCount: 5,
      }),
    ).toBe(false)
  })

  it('defaults incomplete selectable sections open and complete ones closed', () => {
    expect(
      resolveSpellSectionDefaultExpanded({
        kind: 'selectable',
        itemCount: 8,
        selectedCount: 0,
        capacity: 4,
      }),
    ).toBe(true)

    expect(
      resolveSpellSectionDefaultExpanded({
        kind: 'selectable',
        itemCount: 8,
        selectedCount: 4,
        capacity: 4,
      }),
    ).toBe(false)
  })

  it('defaults invalid selectable sections open even when complete', () => {
    expect(
      resolveSpellSectionDefaultExpanded({
        kind: 'selectable',
        itemCount: 8,
        selectedCount: 4,
        capacity: 4,
        hasValidationError: true,
      }),
    ).toBe(true)
  })

  it('formats entitlement progress titles without inventing slot denominators', () => {
    expect(formatSelectionProgress(3, 6)).toBe('3/6')
    expect(formatSpellSectionTitle('Cantrips', '0/4')).toBe('Cantrips · 0/4')
    expect(formatSpellSectionTitle('Prepared Spells', '8/8')).toBe(
      'Prepared Spells · 8/8',
    )
  })
})
