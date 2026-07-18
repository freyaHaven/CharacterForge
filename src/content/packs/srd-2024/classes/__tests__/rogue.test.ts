import { describe, expect, it } from 'vitest'
import { rogueSrd2024 } from '../rogue'
import { FINESSE_OR_LIGHT_WEAPON_IDS } from '../../../../../domain/weapons/types'

describe('rogueSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(rogueSrd2024.id).toBe('srd-2024:rogue')
    expect(rogueSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(rogueSrd2024.catalogStatus).toBeUndefined()
    expect(rogueSrd2024.catalogOrder).toBe(20)
  })

  it('requires four skill proficiencies', () => {
    const skills = rogueSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(4)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(4)
  })

  it('requires Expertise as linked multi-selects at levels 1 and 6', () => {
    const expertise = rogueSrd2024.choices.find(
      (choice) => choice.id === 'expertise',
    )
    const expertise6 = rogueSrd2024.choices.find(
      (choice) => choice.id === 'expertise-6',
    )

    expect(expertise?.type).toBe('multi-select')
    expect(expertise?.type === 'multi-select' ? expertise.min : undefined).toBe(
      2,
    )
    expect(expertise6?.level).toBe(6)
    expect(
      expertise?.type === 'multi-select'
        ? expertise.options.every((option) =>
            option.effects?.some((effect) => effect.kind === 'skill-expertise'),
          )
        : false,
    ).toBe(true)
  })

  it('requires weapon mastery for finesse or light weapons', () => {
    const weaponMasteryChoice = rogueSrd2024.choices.find(
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
    ).toEqual([...FINESSE_OR_LIGHT_WEAPON_IDS])
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      rogueSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'expertise', level: 1 },
      { id: 'weapon-mastery', level: 1 },
      { id: 'rogue-subclass', level: 3 },
      { id: 'expertise-6', level: 6 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-10', level: 10 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
    ])
  })
})
