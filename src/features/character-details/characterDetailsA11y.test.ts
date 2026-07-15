import { describe, expect, it } from 'vitest'
import {
  combineDescribedBy,
  hasSpeciesGuidanceText,
} from './characterDetailsA11y'

describe('characterDetailsA11y', () => {
  describe('combineDescribedBy', () => {
    it('joins multiple ids with spaces', () => {
      expect(
        combineDescribedBy('character-details-age-error', 'character-details-age-species-guidance'),
      ).toBe('character-details-age-error character-details-age-species-guidance')
    })

    it('returns undefined when no ids are provided', () => {
      expect(combineDescribedBy()).toBeUndefined()
      expect(combineDescribedBy(undefined, null, false, '')).toBeUndefined()
    })
  })

  describe('hasSpeciesGuidanceText', () => {
    it('accepts non-empty guidance strings', () => {
      expect(hasSpeciesGuidanceText('Typical height: 170–195 cm')).toBe(true)
    })

    it('rejects empty or missing guidance', () => {
      expect(hasSpeciesGuidanceText('')).toBe(false)
      expect(hasSpeciesGuidanceText(undefined)).toBe(false)
    })
  })
})
