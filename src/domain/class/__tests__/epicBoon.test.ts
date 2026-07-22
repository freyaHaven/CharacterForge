import { describe, expect, it } from 'vitest'
import {
  isCompleteEpicBoonChoiceValue,
  isFeatExcludedFromAsiFeatModePicker,
  isFeatExcludedFromFeatGrantPickers,
  selectEpicBoonFeat,
} from '../epicBoon'
import { ABILITY_SCORE_IMPROVEMENT_FEAT_ID } from '../epicBoon'

describe('epicBoon', () => {
  it('encodes feat selections', () => {
    expect(selectEpicBoonFeat('srd-2024:boon-of-fate')).toBe(
      'feat:srd-2024:boon-of-fate',
    )
    expect(isCompleteEpicBoonChoiceValue('feat:srd-2024:boon-of-fate')).toBe(
      true,
    )
    expect(isCompleteEpicBoonChoiceValue('plus-2:strength')).toBe(false)
    expect(isCompleteEpicBoonChoiceValue('feat')).toBe(false)
  })

  it('excludes the ASI feat only from ASI feat-mode pickers', () => {
    expect(
      isFeatExcludedFromAsiFeatModePicker(ABILITY_SCORE_IMPROVEMENT_FEAT_ID),
    ).toBe(true)
    expect(
      isFeatExcludedFromAsiFeatModePicker('srd-2024:boon-of-combat-prowess'),
    ).toBe(false)
    // Deprecated alias still matches ASI feat-mode exclusion.
    expect(
      isFeatExcludedFromFeatGrantPickers(ABILITY_SCORE_IMPROVEMENT_FEAT_ID),
    ).toBe(true)
  })
})
