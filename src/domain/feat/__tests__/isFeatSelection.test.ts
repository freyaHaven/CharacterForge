import { describe, expect, it } from 'vitest'
import { isFeatSelection } from '../isFeatSelection'

describe('isFeatSelection', () => {
  it('accepts a selection with only canonical player choices', () => {
    expect(
      isFeatSelection({
        featId: 'srd-2024:alert',
        choices: {},
      }),
    ).toBe(true)
  })

  it('accepts selections that include choice values', () => {
    expect(
      isFeatSelection({
        featId: 'srd-2024:example-feat',
        choices: { 'example-choice': 'option-a' },
      }),
    ).toBe(true)
  })

  it('rejects missing or empty feat ids', () => {
    expect(isFeatSelection({ featId: '', choices: {} })).toBe(false)
    expect(isFeatSelection({ choices: {} })).toBe(false)
  })

  it('rejects non-string choice values', () => {
    expect(
      isFeatSelection({
        featId: 'srd-2024:alert',
        choices: { 'example-choice': 1 },
      }),
    ).toBe(false)
  })
})
