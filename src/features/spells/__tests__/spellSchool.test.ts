import { describe, expect, it } from 'vitest'
import { getSpellSchoolGlyph, normalizeSpellSchool } from '../spellSchool'

describe('spellSchool', () => {
  it('normalizes known schools to slugs', () => {
    expect(normalizeSpellSchool('Divination')).toBe('divination')
    expect(normalizeSpellSchool('  Evocation ')).toBe('evocation')
  })

  it('returns unknown for unrecognized schools', () => {
    expect(normalizeSpellSchool('Chronomancy')).toBe('unknown')
  })

  it('returns school glyphs for known schools', () => {
    expect(getSpellSchoolGlyph('Necromancy')).toBe('Ne')
    expect(getSpellSchoolGlyph('Abjuration')).toBe('Ab')
  })

  it('falls back to initials for unknown schools', () => {
    expect(getSpellSchoolGlyph('Chronomancy')).toBe('CH')
  })
})
