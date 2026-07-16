import { describe, expect, it } from 'vitest'
import {
  createClassInstanceDraft,
  getLegacyDraftForInstance,
  isClassInstanceDraftIncomplete,
  removeInstanceDraft,
  setLegacyDraftForInstance,
  updateClassInstanceDraftChoice,
  type ClassSelectionDrafts,
} from '../classSelectionDraft'

describe('multi-instance class drafts', () => {
  it('stores independent choice values for the same choice id', () => {
    let drafts = setLegacyDraftForInstance(
      {},
      'fighter-1',
      {
        classId: 'srd-2024:fighter',
        level: 1,
        choices: { 'fighting-style': 'defense' },
      },
    )

    drafts = setLegacyDraftForInstance(drafts, 'rogue-1', {
      classId: 'srd-2024:rogue',
      level: 1,
      choices: { 'fighting-style': 'archery' },
    })

    expect(getLegacyDraftForInstance(drafts, 'fighter-1')?.choices).toEqual({
      'fighting-style': 'defense',
    })
    expect(getLegacyDraftForInstance(drafts, 'rogue-1')?.choices).toEqual({
      'fighting-style': 'archery',
    })
  })

  it('commits or resets one draft without affecting another', () => {
    let drafts: ClassSelectionDrafts = {
      'fighter-1': createClassInstanceDraft('fighter-1', 'srd-2024:fighter'),
      'rogue-1': createClassInstanceDraft('rogue-1', 'srd-2024:rogue'),
    }

    drafts = removeInstanceDraft(drafts, 'fighter-1')

    expect(drafts['fighter-1']).toBeUndefined()
    expect(drafts['rogue-1']).toBeDefined()
  })

  it('tracks incomplete state per instance', () => {
    const drafts = {
      'fighter-1': updateClassInstanceDraftChoice(
        createClassInstanceDraft('fighter-1', 'srd-2024:fighter'),
        'fighting-style',
        'defense',
      ),
    }

    expect(
      isClassInstanceDraftIncomplete(drafts, 'fighter-1', []),
    ).toBe(true)
    expect(
      isClassInstanceDraftIncomplete(drafts, 'fighter-1', [
        {
          instanceId: 'fighter-1',
          classId: 'srd-2024:fighter',
          level: 1,
          choices: {},
        },
      ]),
    ).toBe(false)
  })
})
