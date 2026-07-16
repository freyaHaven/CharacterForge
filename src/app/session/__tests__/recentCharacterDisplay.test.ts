// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import {
  formatRecentCharacterBuildLine,
  formatRecentCharacterIdentityLine,
  formatRecentEditedLabel,
} from '../recentCharacterDisplay'

describe('recentCharacterDisplay', () => {
  it('formats identity with name and species', () => {
    expect(formatRecentCharacterIdentityLine('Freya', 'Dwarf')).toBe(
      'Freya • Dwarf',
    )
  })

  it('uses Unnamed when the name is blank', () => {
    expect(formatRecentCharacterIdentityLine('  ', 'Human')).toBe(
      'Unnamed • Human',
    )
  })

  it('formats multiclass build lines', () => {
    expect(
      formatRecentCharacterBuildLine([
        { className: 'Fighter', level: 3 },
        { className: 'Rogue', level: 2 },
      ]),
    ).toBe('Fighter 3 • Rogue 2')
  })

  it('returns null when there are no classes', () => {
    expect(formatRecentCharacterBuildLine([])).toBeNull()
  })

  it('formats relative edited labels', () => {
    const now = Date.parse('2026-07-16T14:00:00')

    expect(formatRecentEditedLabel(now - 30_000, now)).toBe('Just now')
    expect(formatRecentEditedLabel(now - 2 * 60 * 60 * 1000, now)).toBe(
      '2 hours ago',
    )
    expect(
      formatRecentEditedLabel(Date.parse('2026-07-15T10:00:00'), now),
    ).toBe('Yesterday')
  })
})
