import { describe, expect, it } from 'vitest'
import { druidSrd2024 } from '../druid'
import {
  DRUID_CANTRIPS_KNOWN_BY_LEVEL,
  DRUID_PREPARED_BY_LEVEL,
} from '../../progressions'
import { getEligibleBeastForms } from '../../../../../domain/class/beastForms'

describe('druidSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(druidSrd2024.id).toBe('srd-2024:druid')
    expect(druidSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(druidSrd2024.catalogStatus).toBeUndefined()
    expect(druidSrd2024.catalogOrder).toBe(13)
  })

  it('uses Wisdom spellcasting as a full caster', () => {
    expect(druidSrd2024.spellcasting?.ability).toBe('wisdom')
    expect(druidSrd2024.spellcasting?.slotContributor).toBe('full')
    expect(druidSrd2024.spellcasting?.entitlements.length).toBeGreaterThan(0)
    expect(druidSrd2024.multiclassPrerequisite).toMatchObject({
      kind: 'all-of',
      abilities: ['wisdom'],
      minimum: 13,
    })
  })

  it('matches the SRD prepared and cantrip tables', () => {
    expect(DRUID_PREPARED_BY_LEVEL).toEqual([
      4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
    ])
    expect(DRUID_CANTRIPS_KNOWN_BY_LEVEL).toEqual([
      2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
    ])
    expect(druidSrd2024.spellcasting?.preparedSpellsByLevel).toEqual(
      DRUID_PREPARED_BY_LEVEL,
    )
    expect(druidSrd2024.spellcasting?.cantripsKnownByLevel).toEqual(
      DRUID_CANTRIPS_KNOWN_BY_LEVEL,
    )
  })

  it('requires two skill proficiencies', () => {
    const skills = druidSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires Primal Order at level 1 with Magician and Warden', () => {
    const primalOrder = druidSrd2024.choices.find(
      (choice) => choice.id === 'primal-order',
    )

    expect(primalOrder?.level).toBe(1)
    expect(primalOrder?.type).toBe('single-select')
    expect(
      primalOrder?.type === 'single-select'
        ? primalOrder.options.map((option) => option.id)
        : [],
    ).toEqual(['magician', 'warden'])

    const warden =
      primalOrder?.type === 'single-select'
        ? primalOrder.options.find((option) => option.id === 'warden')
        : undefined
    expect(warden?.effects).toEqual([
      { kind: 'armor-proficiency', category: 'medium' },
      { kind: 'weapon-proficiency', category: 'martial' },
    ])
  })

  it('grants Druidic language, herbalism kit, and Speak with Animals on the feature', () => {
    const druidic = druidSrd2024.featureProgression
      .find((entry) => entry.level === 1)
      ?.features.find((feature) => feature.id === 'druidic')

    expect(druidic?.effects).toEqual([
      { kind: 'language', languageId: 'druidic', label: 'Druidic' },
      {
        kind: 'tool-proficiency',
        toolId: 'herbalism-kit',
        label: 'Herbalism Kit',
      },
    ])
    expect(druidic?.spellEntitlements?.[0]).toMatchObject({
      id: 'druidic-speak-with-animals',
      kind: 'granted',
      appliesTo: 'prepared',
      countsAgainstLimit: false,
      spells: [{ spellId: 'srd-2024:speak-with-animals', minLevel: 1 }],
    })
  })

  it('requires Elemental Fury at level 7', () => {
    const elementalFury = druidSrd2024.choices.find(
      (choice) => choice.id === 'elemental-fury',
    )

    expect(elementalFury?.level).toBe(7)
    expect(
      elementalFury?.type === 'single-select'
        ? elementalFury.options.map((option) => option.id)
        : [],
    ).toEqual(['potent-spellcasting', 'primal-strike'])
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      druidSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'primal-order', level: 1 },
      { id: 'wild-shape-forms', level: 2 },
      { id: 'druid-subclass', level: 3 },
      { id: 'circle-land', level: 3 },
      { id: 'elemental-fury', level: 7 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })

  it('exposes Wild Shape form pools that expand by level', () => {
    expect(getEligibleBeastForms(2).every((form) => !form.hasFly)).toBe(true)
    expect(getEligibleBeastForms(2).every((form) => form.cr === '1/4')).toBe(
      true,
    )
    expect(getEligibleBeastForms(4).some((form) => form.cr === '1/2')).toBe(
      true,
    )
    expect(getEligibleBeastForms(8).some((form) => form.hasFly)).toBe(true)
  })
})
