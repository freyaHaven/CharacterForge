import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import {
  needsEditionChangeFeatConfirmation,
  validateFeatSelection,
} from '../featRules'

describe('validateFeatSelection', () => {
  it('accepts a valid committed feat', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')

    expect(
      validateFeatSelection(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2024',
        alert,
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

  it('rejects a feat from another edition', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')

    expect(
      validateFeatSelection(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2014',
        alert,
      ),
    ).toEqual({ ok: false, issues: [{ code: 'wrong-edition' }] })
  })

  it('rejects unknown choice keys', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')

    expect(
      validateFeatSelection(
        {
          featId: 'srd-2024:alert',
          choices: { 'unknown-choice': 'value' },
        },
        'srd-2024',
        alert,
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
    const catalog = createBundledFeatCatalog()

    await expect(
      needsEditionChangeFeatConfirmation(
        { featId: 'srd-2024:alert', choices: {} },
        'srd-2014',
        (featId) => catalog.getFeat(featId),
      ),
    ).resolves.toBe(true)
  })
})
