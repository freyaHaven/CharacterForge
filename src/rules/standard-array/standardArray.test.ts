import { describe, expect, it } from 'vitest'
import {
  DEFAULT_STANDARD_ARRAY_ASSIGNMENT,
  validateStandardArrayAssignment,
} from './standardArray'
import type { AbilityScores } from '../../domain/types'

describe('validateStandardArrayAssignment', () => {
  it('accepts a valid assignment using the default layout', () => {
    expect(validateStandardArrayAssignment(DEFAULT_STANDARD_ARRAY_ASSIGNMENT)).toEqual(
      { valid: true },
    )
  })

  it('accepts the same values assigned to different abilities', () => {
    const scores: AbilityScores = {
      strength: 8,
      dexterity: 15,
      constitution: 14,
      intelligence: 13,
      wisdom: 12,
      charisma: 10,
    }

    expect(validateStandardArrayAssignment(scores)).toEqual({ valid: true })
  })

  it('rejects duplicated standard-array values', () => {
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 15,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    }

    const result = validateStandardArrayAssignment(scores)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'duplicate-value',
        value: 15,
        abilities: ['strength', 'dexterity'],
      })
      expect(result.issues).toContainEqual({
        code: 'missing-value',
        value: 14,
      })
    }
  })

  it('rejects assignments missing a required standard-array value', () => {
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 10,
    }

    const result = validateStandardArrayAssignment(scores)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'duplicate-value',
        value: 10,
        abilities: ['wisdom', 'charisma'],
      })
      expect(result.issues).toContainEqual({
        code: 'missing-value',
        value: 8,
      })
    }
  })

  it('rejects values that are not in the standard array', () => {
    const scores: AbilityScores = {
      strength: 16,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    }

    const result = validateStandardArrayAssignment(scores)

    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.issues).toContainEqual({
        code: 'invalid-value',
        value: 16,
        ability: 'strength',
      })
      expect(result.issues).toContainEqual({
        code: 'missing-value',
        value: 15,
      })
    }
  })
})
