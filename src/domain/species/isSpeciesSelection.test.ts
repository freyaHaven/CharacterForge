import { describe, expect, it } from 'vitest'
import { isSpeciesSelection } from './isSpeciesSelection'

describe('isSpeciesSelection', () => {
  it('returns true for a valid selection', () => {
    expect(
      isSpeciesSelection({
        speciesId: 'srd-2024:dwarf',
        choices: {},
      }),
    ).toBe(true)
  })

  it('returns true when choices contain string values', () => {
    expect(
      isSpeciesSelection({
        speciesId: 'srd-2024:human',
        choices: { 'origin-feat': 'alert' },
      }),
    ).toBe(true)
  })

  it('returns false when speciesId is empty', () => {
    expect(isSpeciesSelection({ speciesId: '', choices: {} })).toBe(false)
  })

  it('returns false when choices is not an object', () => {
    expect(
      isSpeciesSelection({ speciesId: 'srd-2024:dwarf', choices: null }),
    ).toBe(false)
  })
})
