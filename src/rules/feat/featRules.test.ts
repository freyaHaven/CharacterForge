import { describe, expect, it } from 'vitest'
import { alertSrd2024 } from '../../data/feats/srd-2024/alert'
import {
  needsEditionChangeFeatConfirmation,
  validateFeatSelection,
} from './featRules'

describe('validateFeatSelection', () => {
  it('accepts a valid committed feat', () => {
    expect(
      validateFeatSelection(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2024',
        alertSrd2024,
      ),
    ).toEqual({ ok: true })
  })

  it('rejects an unknown feat', () => {
    expect(
      validateFeatSelection(
        { featId: 'srd-2024:unknown', choices: {} },
        'srd-2024',
        null,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'feat-not-found' }] })
  })

  it('rejects a feat from another edition', () => {
    expect(
      validateFeatSelection(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2014',
        alertSrd2024,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'wrong-edition' }] })
  })

  it('rejects unknown choice keys', () => {
    expect(
      validateFeatSelection(
        {
          featId: 'srd-2024:alert',
          choices: { 'unknown-choice': 'value' },
        },
        'srd-2024',
        alertSrd2024,
      ),
    ).toEqual({
      ok: false,
      issues: [{ code: 'unknown-choice', choiceId: 'unknown-choice' }],
    })
  })
})

describe('needsEditionChangeFeatConfirmation', () => {
  it('does not require confirmation when no feat is selected', async () => {
    await expect(
      needsEditionChangeFeatConfirmation(null, 'srd-2014', async () => null),
    ).resolves.toBe(false)
  })

  it('requires confirmation when the feat belongs to another edition', async () => {
    await expect(
      needsEditionChangeFeatConfirmation(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2014',
        async () => alertSrd2024,
      ),
    ).resolves.toBe(true)
  })
})
