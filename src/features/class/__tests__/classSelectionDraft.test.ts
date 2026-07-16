import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import { createFighterWeaponMasteryChoices } from '../../../content/packs/srd-2024/classes/fighter.weaponMastery'
import {
  createClassSelectionDraft,
  draftToClassSelection,
  initializeClassInstanceDraft,
  instanceDraftToLegacyDraft,
  isClassDraftIncomplete,
  tryCommitClassDraft,
  updateClassDraftChoice,
  updateClassDraftLevel,
} from '../classSelectionDraft'

describe('classSelectionDraft', () => {
  it('creates a level 1 draft with empty choices', () => {
    expect(createClassSelectionDraft('srd-2024:fighter')).toEqual({
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {},
      hitPointIncreases: [{ classLevel: 1, method: 'max' }],
    })
  })

  it('commits when all required choices are valid', () => {
    const draft = createClassSelectionDraft('srd-2024:fighter')
    const withChoices = updateClassDraftChoice(
      updateClassDraftChoice(
        updateClassDraftChoice(draft, 'fighting-style', 'defense'),
        'skill-proficiencies',
        ['athletics', 'perception'],
      ),
      'weapon-mastery',
      createFighterWeaponMasteryChoices(1)['weapon-mastery'],
    )

    expect(tryCommitClassDraft(withChoices, 'srd-2024', fighterSrd2024)).toEqual({
      committed: {
        classId: 'srd-2024:fighter',
        level: 1,
        choices: {
          'fighting-style': 'defense',
          'skill-proficiencies': ['athletics', 'perception'],
          ...createFighterWeaponMasteryChoices(1),
        },
        hitPointIncreases: [{ classLevel: 1, method: 'max' }],
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

    expect(
      instanceDraftToLegacyDraft(
        initializeClassInstanceDraft({
          instanceId: 'fighter-instance-1',
          classId: selection.classId,
          level: selection.level,
          choices: selection.choices,
        }),
      ),
    ).toEqual({
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

  it('prunes unavailable choices when lowering the level', () => {
    const draft = updateClassDraftLevel(
      {
        classId: 'srd-2024:fighter',
        level: 5,
        choices: {
          'fighting-style': 'archery',
          'skill-proficiencies': ['athletics', 'perception'],
          ...createFighterWeaponMasteryChoices(1),
          'fighter-subclass': 'champion',
        },
      },
      1,
      fighterSrd2024,
    )

    expect(draft).toEqual({
      classId: 'srd-2024:fighter',
      level: 1,
      choices: {
        'fighting-style': 'archery',
        'skill-proficiencies': ['athletics', 'perception'],
        ...createFighterWeaponMasteryChoices(1),
      },
      hitPointIncreases: [{ classLevel: 1, method: 'max' }],
    })
  })

  it('commits after lowering the level when remaining choices are valid', () => {
    const lowered = updateClassDraftLevel(
      {
        classId: 'srd-2024:fighter',
        level: 5,
        choices: {
          'fighting-style': 'archery',
          'skill-proficiencies': ['athletics', 'perception'],
          ...createFighterWeaponMasteryChoices(1),
          'fighter-subclass': 'champion',
        },
      },
      1,
      fighterSrd2024,
    )

    expect(tryCommitClassDraft(lowered, 'srd-2024', fighterSrd2024)).toEqual({
      committed: lowered,
      validation: { ok: true },
    })
  })

  it('keeps a raised level draft uncommitted until new required choices are complete', () => {
    const completeLevelOne = updateClassDraftChoice(
      updateClassDraftChoice(
        updateClassDraftChoice(
          createClassSelectionDraft('srd-2024:fighter'),
          'fighting-style',
          'defense',
        ),
        'skill-proficiencies',
        ['athletics', 'perception'],
      ),
      'weapon-mastery',
      createFighterWeaponMasteryChoices(1)['weapon-mastery'],
    )

    const raised = updateClassDraftLevel(completeLevelOne, 3, fighterSrd2024)

    expect(tryCommitClassDraft(raised, 'srd-2024', fighterSrd2024).committed).toBeNull()
  })
})
