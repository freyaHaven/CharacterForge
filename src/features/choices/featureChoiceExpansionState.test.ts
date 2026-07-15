import { describe, expect, it } from 'vitest'
import {
  getFeatureChoiceExpanded,
  pruneFeatureChoiceExpansionState,
  setFeatureChoiceExpanded,
} from './featureChoiceExpansionState'
import { createClassChoiceStateKey } from '../class/classChoiceStateKeys'

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
      [createClassChoiceStateKey('fighter-1', 'fighting-style')]: false,
      [createClassChoiceStateKey('fighter-1', 'fighter-subclass')]: true,
    }

    expect(
      pruneFeatureChoiceExpansionState(state, [
        createClassChoiceStateKey('fighter-1', 'fighting-style'),
      ]),
    ).toEqual({
      [createClassChoiceStateKey('fighter-1', 'fighting-style')]: false,
    })
  })

  it('keeps expansion state scoped per instance', () => {
    const fighterKey = createClassChoiceStateKey('fighter-1', 'fighting-style')
    const rogueKey = createClassChoiceStateKey('rogue-1', 'fighting-style')

    expect(getFeatureChoiceExpanded({ [fighterKey]: false }, rogueKey, false)).toBe(
      true,
    )
  })
})
