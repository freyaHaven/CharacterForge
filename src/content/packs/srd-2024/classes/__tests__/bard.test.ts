import { describe, expect, it } from 'vitest'
import { bardSrd2024 } from '../bard'
import {
  BARD_CANTRIPS_KNOWN_BY_LEVEL,
  BARD_PREPARED_BY_LEVEL,
} from '../../progressions'
import { SPELL_LIST_IDS } from '../../spell-lists'
import { MUSICAL_INSTRUMENT_LABELS } from '../../../../../domain/tools/types'

describe('bardSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(bardSrd2024.id).toBe('srd-2024:bard')
    expect(bardSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(bardSrd2024.catalogStatus).toBeUndefined()
    expect(bardSrd2024.catalogOrder).toBe(11)
  })

  it('uses Charisma spellcasting as a full caster', () => {
    expect(bardSrd2024.spellcasting?.ability).toBe('charisma')
    expect(bardSrd2024.spellcasting?.slotContributor).toBe('full')
    expect(bardSrd2024.spellcasting?.entitlements.length).toBeGreaterThan(0)
    expect(bardSrd2024.multiclassPrerequisite).toMatchObject({
      kind: 'all-of',
      abilities: ['charisma'],
      minimum: 13,
    })
  })

  it('matches the SRD prepared and cantrip tables', () => {
    expect(BARD_PREPARED_BY_LEVEL).toEqual([
      4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
    ])
    expect(BARD_CANTRIPS_KNOWN_BY_LEVEL).toEqual([
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    ])
    expect(bardSrd2024.spellcasting?.preparedSpellsByLevel).toEqual(
      BARD_PREPARED_BY_LEVEL,
    )
    expect(bardSrd2024.spellcasting?.cantripsKnownByLevel).toEqual(
      BARD_CANTRIPS_KNOWN_BY_LEVEL,
    )
  })

  it('expands prepared spells via Magical Secrets from level 10', () => {
    const prepared = bardSrd2024.spellcasting?.entitlements.find(
      (entry) => entry.kind === 'select' && entry.id === 'prepared',
    )

    expect(prepared?.kind === 'select' ? prepared.expandedListId : undefined).toBe(
      SPELL_LIST_IDS.magicalSecrets,
    )
    expect(
      prepared?.kind === 'select' ? prepared.expandedFromLevel : undefined,
    ).toBe(10)
  })

  it('requires three skill proficiencies', () => {
    const skills = bardSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(3)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(3)
  })

  it('requires three musical instruments with tool-proficiency effects', () => {
    const instruments = bardSrd2024.choices.find(
      (choice) => choice.id === 'musical-instruments',
    )

    expect(instruments?.type).toBe('multi-select')
    expect(instruments?.type === 'multi-select' ? instruments.min : undefined).toBe(
      3,
    )
    expect(instruments?.type === 'multi-select' ? instruments.max : undefined).toBe(
      3,
    )
    expect(
      instruments?.type === 'multi-select'
        ? instruments.options.every((option) =>
            option.effects?.some(
              (effect) =>
                effect.kind === 'tool-proficiency' &&
                effect.label === MUSICAL_INSTRUMENT_LABELS[option.id as keyof typeof MUSICAL_INSTRUMENT_LABELS],
            ),
          )
        : false,
    ).toBe(true)
  })

  it('grants Jack of All Trades on the level 2 feature', () => {
    const jack = bardSrd2024.featureProgression
      .find((entry) => entry.level === 2)
      ?.features.find((feature) => feature.id === 'jack-of-all-trades')

    expect(jack?.effects).toEqual([{ kind: 'jack-of-all-trades' }])
  })

  it('grants Words of Creation spells on the level 20 feature', () => {
    const words = bardSrd2024.featureProgression
      .find((entry) => entry.level === 20)
      ?.features.find((feature) => feature.id === 'words-of-creation')

    expect(words?.spellEntitlements?.[0]).toMatchObject({
      id: 'words-of-creation',
      kind: 'granted',
      appliesTo: 'prepared',
      countsAgainstLimit: false,
      spells: [
        { spellId: 'srd-2024:power-word-heal', minLevel: 20 },
        { spellId: 'srd-2024:power-word-kill', minLevel: 20 },
      ],
    })
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      bardSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'musical-instruments', level: 1 },
      { id: 'expertise', level: 2 },
      { id: 'bard-subclass', level: 3 },
      { id: 'lore-bonus-proficiencies', level: 3 },
      { id: 'expertise-9', level: 9 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })

  it('recommends Boon of Spell Recall for the Epic Boon', () => {
    const epicBoon = bardSrd2024.choices.find((choice) => choice.id === 'epic-boon')

    expect(
      epicBoon?.type === 'single-select' ? epicBoon.recommendedFeatId : undefined,
    ).toBe('srd-2024:boon-of-spell-recall')
  })
})
