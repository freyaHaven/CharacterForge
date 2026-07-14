import { describe, expect, it } from 'vitest'
import { getChoiceAccordionTitle } from './getChoiceAccordionTitle'

describe('getChoiceAccordionTitle', () => {
  it('strips choose-a prefixes from prompts', () => {
    expect(getChoiceAccordionTitle('Choose a Fighting Style')).toBe(
      'Fighting Style',
    )
  })

  it('returns the prompt unchanged when no prefix is present', () => {
    expect(getChoiceAccordionTitle('Fighting Style')).toBe('Fighting Style')
  })
})
