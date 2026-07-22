import { describe, expect, it } from 'vitest'
import { rangerSrd2024 } from '../ranger'
import { WEAPON_IDS } from '../../../../../domain/weapons/types'

describe('rangerSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(rangerSrd2024.id).toBe('srd-2024:ranger')
    expect(rangerSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(rangerSrd2024.catalogStatus).toBeUndefined()
    expect(rangerSrd2024.catalogOrder).toBe(18)
  })

  it('uses Wisdom spellcasting', () => {
    expect(rangerSrd2024.spellcasting?.ability).toBe('wisdom')
    expect(rangerSrd2024.spellcasting?.slotContributor).toBe('half')
  })

  it('requires three skill proficiencies', () => {
    const skills = rangerSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(3)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(3)
  })

  it('requires Expertise as linked multi-selects at levels 2 and 9', () => {
    const expertise = rangerSrd2024.choices.find(
      (choice) => choice.id === 'expertise',
    )
    const expertise9 = rangerSrd2024.choices.find(
      (choice) => choice.id === 'expertise-9',
    )

    expect(expertise?.level).toBe(2)
    expect(expertise?.type).toBe('multi-select')
    expect(expertise?.type === 'multi-select' ? expertise.min : undefined).toBe(
      1,
    )
    expect(expertise9?.level).toBe(9)
    expect(
      expertise9?.type === 'multi-select' ? expertise9.min : undefined,
    ).toBe(2)
    expect(
      expertise?.type === 'multi-select'
        ? expertise.options.every((option) =>
            option.effects?.some((effect) => effect.kind === 'skill-expertise'),
          )
        : false,
    ).toBe(true)
  })

  it('requires fighting style at level 2 including Druidic Warrior alternate', () => {
    const fightingStyle = rangerSrd2024.choices.find(
      (choice) => choice.id === 'fighting-style',
    )

    expect(fightingStyle?.level).toBe(2)
    expect(fightingStyle?.type).toBe('single-select')
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.featGrantCategory
        : undefined,
    ).toBe('fighting-style')
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.options.map((option) => option.id)
        : [],
    ).toEqual(['druidic-warrior'])
  })

  it('requires weapon mastery for simple and martial weapons', () => {
    const weaponMasteryChoice = rangerSrd2024.choices.find(
      (choice) => choice.id === 'weapon-mastery',
    )

    expect(weaponMasteryChoice?.type).toBe('multi-select')
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.min
        : undefined,
    ).toBe(2)
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.options.map((option) => option.id)
        : [],
    ).toEqual([...WEAPON_IDS])
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      rangerSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'weapon-mastery', level: 1 },
      { id: 'fighting-style', level: 2 },
      { id: 'expertise', level: 2 },
      { id: 'ranger-subclass', level: 3 },
      { id: 'expertise-9', level: 9 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })
})
