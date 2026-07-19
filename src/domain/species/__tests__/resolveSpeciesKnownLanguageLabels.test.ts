import { describe, expect, it } from 'vitest'
import { SRD_2024_ORIGIN_LANGUAGES } from '../../../content/packs/srd-2024/species/originLanguages'
import { resolveSpeciesKnownLanguageLabels } from '../standardLanguages'

describe('resolveSpeciesKnownLanguageLabels', () => {
  it('includes Common grants and selected standard languages', () => {
    expect(
      resolveSpeciesKnownLanguageLabels(SRD_2024_ORIGIN_LANGUAGES, {
        speciesId: 'srd-2024:dwarf',
        choices: {
          'standard-languages': ['dwarvish', 'elvish'],
        },
      }),
    ).toEqual(['Common', 'Dwarvish', 'Elvish'])
  })

  it('returns only grants when language choices are incomplete', () => {
    expect(
      resolveSpeciesKnownLanguageLabels(SRD_2024_ORIGIN_LANGUAGES, {
        speciesId: 'srd-2024:dwarf',
        choices: {},
      }),
    ).toEqual(['Common'])
  })
})
