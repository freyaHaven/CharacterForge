import { describe, expect, it } from 'vitest'
import { createDefaultCharacterDetails } from '../../domain/character/details'
import {
  formatCharacterDetailsReviewSections,
  hasCharacterDetailsReviewContent,
} from './formatCharacterDetailsReview'

describe('formatCharacterDetailsReviewSections', () => {
  it('groups populated fields into identity, personality, and backstory sections', () => {
    const sections = formatCharacterDetailsReviewSections({
      ...createDefaultCharacterDetails(),
      age: '27',
      gender: 'female',
      pronouns: 'she-her',
      alignment: 'chaotic-good',
      flaws: 'Hot-headed',
      backstoryNotes: 'Left home at sixteen.',
    })

    expect(sections.identity).toEqual(['Gender: Female'])
    expect(sections.personality).toEqual(['Flaws: Hot-headed'])
    expect(sections.backstoryNotes).toBe('Left home at sixteen.')
    expect(hasCharacterDetailsReviewContent(sections)).toBe(true)
  })

  it('returns empty sections when no details are populated', () => {
    const sections = formatCharacterDetailsReviewSections(
      createDefaultCharacterDetails(),
    )

    expect(sections).toEqual({
      identity: [],
      personality: [],
      backstoryNotes: null,
    })
    expect(hasCharacterDetailsReviewContent(sections)).toBe(false)
  })
})
