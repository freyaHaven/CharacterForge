import { describe, expect, it } from 'vitest'
import { paladinSrd2024 } from '../paladin'

describe('paladinSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(paladinSrd2024.id).toBe('srd-2024:paladin')
    expect(paladinSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(paladinSrd2024.catalogStatus).toBeUndefined()
    expect(paladinSrd2024.catalogOrder).toBe(16)
  })

  it('uses Charisma spellcasting', () => {
    expect(paladinSrd2024.spellcasting).toEqual({ ability: 'charisma' })
  })

  it('requires two skill proficiencies', () => {
    const skills = paladinSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires weapon mastery as a class-step multi-select', () => {
    const weaponMasteryChoice = paladinSrd2024.choices.find(
      (choice) => choice.id === 'weapon-mastery',
    )

    expect(weaponMasteryChoice?.type).toBe('multi-select')
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.min
        : undefined,
    ).toBe(2)
  })

  it('includes Blessed Warrior among Fighting Style options', () => {
    const fightingStyle = paladinSrd2024.choices.find(
      (choice) => choice.id === 'fighting-style',
    )

    expect(fightingStyle?.type).toBe('single-select')
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.options.map((option) => option.id)
        : [],
    ).toEqual([
      'defense',
      'great-weapon-fighting',
      'two-weapon-fighting',
      'blessed-warrior',
    ])
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      paladinSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'weapon-mastery', level: 1 },
      { id: 'fighting-style', level: 2 },
      { id: 'paladin-subclass', level: 3 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
    ])
  })
})
