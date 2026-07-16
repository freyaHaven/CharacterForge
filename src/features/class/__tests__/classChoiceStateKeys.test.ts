import { describe, expect, it } from 'vitest'
import {
  createClassChoiceStateKey,
  createDeferredRequirementKey,
} from '../classChoiceStateKeys'

describe('classChoiceStateKeys', () => {
  it('creates distinct keys for identical choice ids on different instances', () => {
    expect(createClassChoiceStateKey('fighter-1', 'fighting-style')).not.toBe(
      createClassChoiceStateKey('rogue-1', 'fighting-style'),
    )
  })

  it('creates distinct deferred requirement keys per instance', () => {
    expect(
      createDeferredRequirementKey('fighter-1', 'ability-score-improvement-4'),
    ).not.toBe(
      createDeferredRequirementKey('rogue-1', 'ability-score-improvement-4'),
    )
  })
})
