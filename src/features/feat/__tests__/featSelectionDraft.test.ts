import { describe, expect, it } from 'vitest'
import { createBundledFeatCatalog } from '../../../adapters/bundledFeatCatalog'
import {
  createFeatSelectionDraft,
  draftToFeatSelection,
  isFeatDraftIncomplete,
  tryCommitFeatDraft,
} from '../featSelectionDraft'

describe('featSelectionDraft', () => {
  it('commits Alert immediately because it has no required choices', async () => {
    const alert = await createBundledFeatCatalog().getFeat('srd-2024:alert')
    const draft = createFeatSelectionDraft('srd-2024:alert')

    expect(tryCommitFeatDraft(draft, 'srd-2024', alert)).toEqual({
      committed: { featId: 'srd-2024:alert', choices: {} },
      validation: { ok: true },
    })
  })

  it('does not commit an unknown feat', () => {
    const draft = createFeatSelectionDraft('srd-2024:unknown')

    expect(tryCommitFeatDraft(draft, 'srd-2024', null)).toEqual({
      committed: null,
      validation: {
        ok: false,
        issues: [{ code: 'feat-not-found' }],
      },
    })
  })

  it('marks incomplete drafts when nothing is committed', () => {
    const draft = createFeatSelectionDraft('srd-2024:alert')

    expect(isFeatDraftIncomplete(draft, null)).toBe(true)
    expect(
      isFeatDraftIncomplete(null, draftToFeatSelection(draft)),
    ).toBe(false)
  })
})
