import { describe, expect, it } from 'vitest'
import { barbarianSrd2024 } from '../barbarian'
import { MELEE_WEAPON_IDS } from '../../../../../domain/weapons/types'

describe('barbarianSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(barbarianSrd2024.id).toBe('srd-2024:barbarian')
    expect(barbarianSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(barbarianSrd2024.catalogStatus).toBeUndefined()
  })

  it('requires two skill proficiencies', () => {
    const skills = barbarianSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires weapon mastery as a class-step multi-select of melee weapons', () => {
    const weaponMasteryChoice = barbarianSrd2024.choices.find(
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
        ? weaponMasteryChoice.max
        : undefined,
    ).toBe(2)
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.options.map((option) => option.id)
        : [],
    ).toEqual([...MELEE_WEAPON_IDS])

    const weaponMastery = barbarianSrd2024.featureProgression
      .flatMap((entry) => entry.features)
      .find((feature) => feature.id === 'weapon-mastery')

    expect(weaponMastery?.description).toMatch(/two kinds of/i)
    expect(weaponMastery?.description).toMatch(/Melee weapons/i)
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      barbarianSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'weapon-mastery', level: 1 },
      { id: 'weapon-mastery-weapons-3', level: 4 },
      { id: 'weapon-mastery-weapons-4', level: 10 },
      { id: 'barbarian-subclass', level: 3 },
      { id: 'primal-knowledge', level: 3 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
    ])
  })
})
