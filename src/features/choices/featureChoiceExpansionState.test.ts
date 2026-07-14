import { describe, expect, it } from 'vitest'
import {
  getFeatureChoiceExpanded,
  pruneFeatureChoiceExpansionState,
  setFeatureChoiceExpanded,
} from './featureChoiceExpansionState'

describe('featureChoiceExpansionState', () => {
  it('auto-expands incomplete choices when no stored state exists', () => {
    expect(getFeatureChoiceExpanded({}, 'fighting-style', false)).toBe(true)
    expect(getFeatureChoiceExpanded({}, 'fighting-style', true)).toBe(false)
  })

  it('preserves stored expansion state for available choices', () => {
    const state = setFeatureChoiceExpanded({}, 'fighting-style', true)

    expect(getFeatureChoiceExpanded(state, 'fighting-style', true)).toBe(true)
  })

  it('removes expansion state for choices that become unavailable', () => {
    const state = {
      'fighting-style': false,
      'martial-archetype': true,
    }

    expect(
      pruneFeatureChoiceExpansionState(state, ['fighting-style']),
    ).toEqual({
      'fighting-style': false,
    })
  })
})
