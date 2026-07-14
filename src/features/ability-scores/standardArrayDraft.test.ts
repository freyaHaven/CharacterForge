import { describe, expect, it } from 'vitest'
import {
  abilityScoresToStandardArrayDraft,
  createEmptyStandardArrayDraft,
  defaultStandardArrayDraft,
  isStandardArrayDraftComplete,
  validateStandardArrayDraft,
} from './standardArrayDraft'
import { DEFAULT_STANDARD_ARRAY_ASSIGNMENT } from '../../rules/standard-array/standardArray'
import type { AbilityScores } from '../../domain/types'

describe('standardArrayDraft', () => {
  it('converts a valid assignment into a fully assigned draft', () => {
    expect(
      abilityScoresToStandardArrayDraft(DEFAULT_STANDARD_ARRAY_ASSIGNMENT),
    ).toEqual(defaultStandardArrayDraft())
  })

  it('marks duplicate or non-standard values as unassigned when converting', () => {
    const scores: AbilityScores = {
      strength: 10,
      dexterity: 10,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 16,
    }

    expect(abilityScoresToStandardArrayDraft(scores)).toEqual({
      strength: null,
      dexterity: null,
      constitution: 13,
      intelligence: 12,
      wisdom: null,
      charisma: null,
    })
  })

  it('treats unassigned slots as incomplete rather than invalid scores', () => {
    const draft = createEmptyStandardArrayDraft()
    draft.strength = 15

    const result = validateStandardArrayDraft(draft)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'unassigned-ability',
        ability: 'dexterity',
      })
      expect(
        result.issues.some((issue) => issue.code === 'invalid-value'),
      ).toBe(false)
    }
  })

  it('accepts a complete valid draft with reassigned values', () => {
    const draft = defaultStandardArrayDraft()

    draft.strength = null
    draft.dexterity = 15
    draft.strength = 14

    expect(isStandardArrayDraftComplete(draft)).toBe(true)
    expect(validateStandardArrayDraft(draft)).toEqual({ valid: true })
  })
})
