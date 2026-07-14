import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from './fighter'

describe('fighterSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(fighterSrd2024.id).toBe('srd-2024:fighter')
    expect(fighterSrd2024.editionId).toBe('srd-2024')
  })

  it('includes only the SRD 5.2.1 fighting style options', () => {
    const fightingStyle = fighterSrd2024.choices.find(
      (choice) => choice.id === 'fighting-style',
    )

    expect(fightingStyle?.type).toBe('single-select')
    expect(
      fightingStyle?.type === 'single-select'
        ? fightingStyle.options.map((option) => option.id)
        : [],
    ).toEqual([
      'archery',
      'defense',
      'great-weapon-fighting',
      'two-weapon-fighting',
    ])
  })

  it('requires two skill proficiencies', () => {
    const skills = fighterSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('describes weapon mastery without a class-step choice', () => {
    expect(
      fighterSrd2024.choices.some((choice) => choice.id === 'weapon-mastery'),
    ).toBe(false)

    const weaponMastery = fighterSrd2024.featureProgression
      .flatMap((entry) => entry.features)
      .find((feature) => feature.id === 'weapon-mastery')

    expect(weaponMastery?.description).toMatch(/three kinds of weapons/i)
    expect(weaponMastery?.description).toMatch(/equipment step/i)
  })
})
