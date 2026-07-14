import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import {
  createClassSelectionDraft,
  draftToClassSelection,
  initializeClassSelectionDraft,
  isClassDraftIncomplete,
  tryCommitClassDraft,
  updateClassDraftChoice,
} from './classSelectionDraft'

describe('classSelectionDraft', () => {
  it('creates a level 1 draft with empty choices', () => {
    expect(createClassSelectionDraft('srd-2024:fighter')).toEqual({
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {},
    })
  })

  it('commits when all required choices are valid', () => {
    const draft = createClassSelectionDraft('srd-2024:fighter')
    const withChoices = updateClassDraftChoice(
      updateClassDraftChoice(draft, 'fighting-style', 'defense'),
      'skill-proficiencies',
      ['athletics', 'perception'],
    )

    expect(tryCommitClassDraft(withChoices, 'srd-2024', fighterSrd2024)).toEqual({
      committed: {
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
        },
      },
      validation: { ok: true },
    })
  })

  it('keeps an incomplete draft uncommitted', () => {
    const draft = createClassSelectionDraft('srd-2024:fighter')

    expect(tryCommitClassDraft(draft, 'srd-2024', fighterSrd2024).committed).toBeNull()
  })

  it('restores a committed selection into a draft', () => {
    const selection = draftToClassSelection(
      updateClassDraftChoice(
        updateClassDraftChoice(
          createClassSelectionDraft('srd-2024:fighter'),
          'fighting-style',
          'archery',
        ),
        'skill-proficiencies',
        ['history', 'insight'],
      ),
    )

    expect(initializeClassSelectionDraft(selection)).toEqual({
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {
        'fighting-style': 'archery',
        'skill-proficiencies': ['history', 'insight'],
      },
    })
  })

  it('reports draft-only state while committed selection is null', () => {
    const draft = createClassSelectionDraft('srd-2024:fighter')

    expect(isClassDraftIncomplete(draft, null)).toBe(true)
    expect(
      isClassDraftIncomplete(null, {
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {},
      }),
    ).toBe(false)
  })
})
