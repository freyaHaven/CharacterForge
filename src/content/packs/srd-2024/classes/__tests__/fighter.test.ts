import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../fighter'

describe('fighterSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(fighterSrd2024.id).toBe('srd-2024:fighter')
    expect(fighterSrd2024.editionId).toBe('srd-2024')
  })

  it('grants Fighting Style feats via the shared feat-grant catalogue', () => {
    const fightingStyle = fighterSrd2024.choices.find(
      (choice) => choice.id === 'fighting-style',
    )

    expect(fightingStyle?.type).toBe('single-select')
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.featGrantCategory
        : undefined,
    ).toBe('fighting-style')
    expect(
      fightingStyle?.type === 'single-select' ? fightingStyle.options : [],
    ).toEqual([])
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.recommendedFeatId
        : undefined,
    ).toBe('srd-2024:defense')
  })

  it('requires two skill proficiencies', () => {
    const skills = fighterSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires weapon mastery as a class-step multi-select', () => {
    const weaponMasteryChoice = fighterSrd2024.choices.find(
      (choice) => choice.id === 'weapon-mastery',
    )

    expect(weaponMasteryChoice?.type).toBe('multi-select')
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.min
        : undefined,
    ).toBe(3)
    expect(
      weaponMasteryChoice?.type === 'multi-select'
        ? weaponMasteryChoice.max
        : undefined,
    ).toBe(3)

    const weaponMastery = fighterSrd2024.featureProgression
      .flatMap((entry) => entry.features)
      .find((feature) => feature.id === 'weapon-mastery')

    expect(weaponMastery?.description).toMatch(/three kinds of/i)
    expect(weaponMastery?.description).not.toMatch(/equipment step/i)
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      fighterSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'fighting-style', level: 1 },
      { id: 'skill-proficiencies', level: 1 },
      { id: 'weapon-mastery', level: 1 },
      { id: 'weapon-mastery-weapons-4', level: 4 },
      { id: 'weapon-mastery-weapons-5', level: 10 },
      { id: 'weapon-mastery-weapons-6', level: 16 },
      { id: 'fighter-subclass', level: 3 },
      { id: 'champion-additional-fighting-style', level: 7 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-6', level: 6 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-14', level: 14 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })
})
