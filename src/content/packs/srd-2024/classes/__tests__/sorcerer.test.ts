import { describe, expect, it } from 'vitest'
import { sorcererSrd2024 } from '../sorcerer'
import {
  SORCERER_CANTRIPS_KNOWN_BY_LEVEL,
  SORCERER_PREPARED_BY_LEVEL,
} from '../../../../../domain/spell/progressions'
import { SPELL_LIST_IDS } from '../../spell-lists'
import { getExcludedSharedPoolOptionIds } from '../../../../../domain/class/sharedMultiSelectExclusions'

describe('sorcererSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(sorcererSrd2024.id).toBe('srd-2024:sorcerer')
    expect(sorcererSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(sorcererSrd2024.catalogStatus).toBeUndefined()
    expect(sorcererSrd2024.catalogOrder).toBe(12)
  })

  it('uses Charisma spellcasting as a prepared full caster', () => {
    expect(sorcererSrd2024.spellcasting?.ability).toBe('charisma')
    expect(sorcererSrd2024.spellcasting?.slotContributor).toBe('full')
    expect(sorcererSrd2024.spellcasting?.spellListId).toBe(SPELL_LIST_IDS.sorcerer)
    expect(sorcererSrd2024.spellcasting?.entitlements.length).toBeGreaterThan(0)
    expect(sorcererSrd2024.multiclassPrerequisite).toMatchObject({
      kind: 'all-of',
      abilities: ['charisma'],
      minimum: 13,
    })
  })

  it('matches the SRD prepared and cantrip tables', () => {
    expect(SORCERER_PREPARED_BY_LEVEL).toEqual([
      2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
    ])
    expect(SORCERER_CANTRIPS_KNOWN_BY_LEVEL).toEqual([
      4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    ])
    expect(sorcererSrd2024.spellcasting?.preparedSpellsByLevel).toEqual(
      SORCERER_PREPARED_BY_LEVEL,
    )
    expect(sorcererSrd2024.spellcasting?.cantripsKnownByLevel).toEqual(
      SORCERER_CANTRIPS_KNOWN_BY_LEVEL,
    )
  })

  it('requires two skill proficiencies from the Sorcerer list', () => {
    const skills = sorcererSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
    expect(
      skills?.type === 'multi-select'
        ? skills.options.map((option) => option.id)
        : [],
    ).toEqual([
      'arcana',
      'deception',
      'insight',
      'intimidation',
      'persuasion',
      'religion',
    ])
  })

  it('requires Metamagic picks of two at levels 2, 10, and 17', () => {
    for (const choiceId of ['metamagic', 'metamagic-10', 'metamagic-17'] as const) {
      const choice = sorcererSrd2024.choices.find((entry) => entry.id === choiceId)
      expect(choice?.type).toBe('multi-select')
      expect(choice?.type === 'multi-select' ? choice.min : undefined).toBe(2)
      expect(choice?.type === 'multi-select' ? choice.max : undefined).toBe(2)
      expect(
        choice?.type === 'multi-select' ? choice.options : [],
      ).toHaveLength(10)
    }
  })

  it('excludes Metamagic options already selected on sibling choices', () => {
    const excluded = getExcludedSharedPoolOptionIds(
      sorcererSrd2024,
      'metamagic-10',
      {
        metamagic: ['careful-spell', 'distant-spell'],
        'metamagic-10': [],
      },
    )

    expect(excluded).toEqual(
      expect.arrayContaining(['careful-spell', 'distant-spell']),
    )
    expect(excluded).not.toContain('twinned-spell')
  })

  it('recommends Boon of Dimensional Travel for the Epic Boon', () => {
    const epicBoon = sorcererSrd2024.choices.find(
      (choice) => choice.id === 'epic-boon',
    )

    expect(
      epicBoon?.type === 'single-select' ? epicBoon.recommendedFeatId : undefined,
    ).toBe('srd-2024:boon-of-dimensional-travel')
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      sorcererSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'metamagic', level: 2 },
      { id: 'sorcerer-subclass', level: 3 },
      { id: 'elemental-affinity', level: 6 },
      { id: 'metamagic-10', level: 10 },
      { id: 'metamagic-17', level: 17 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })

  it('has no armor proficiency and simple weapons only', () => {
    expect(sorcererSrd2024.proficiencies.armor).toEqual([])
    expect(sorcererSrd2024.proficiencies.weapons).toEqual(['simple'])
    expect(sorcererSrd2024.hitDie.sides).toBe(6)
    expect(sorcererSrd2024.savingThrows).toEqual(['constitution', 'charisma'])
  })
})
