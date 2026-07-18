import { describe, expect, it } from 'vitest'
import { clericSrd2024 } from '../cleric'

describe('clericSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(clericSrd2024.id).toBe('srd-2024:cleric')
    expect(clericSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(clericSrd2024.catalogStatus).toBeUndefined()
    expect(clericSrd2024.catalogOrder).toBe(12)
  })

  it('uses Wisdom spellcasting', () => {
    expect(clericSrd2024.spellcasting?.ability).toBe('wisdom')
    expect(clericSrd2024.spellcasting?.slotContributor).toBe('full')
    expect(clericSrd2024.spellcasting?.entitlements.length).toBeGreaterThan(0)
  })

  it('requires two skill proficiencies', () => {
    const skills = clericSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires Divine Order at level 1', () => {
    const divineOrder = clericSrd2024.choices.find(
      (choice) => choice.id === 'divine-order',
    )

    expect(divineOrder?.level).toBe(1)
    expect(divineOrder?.type).toBe('single-select')
    expect(
      divineOrder?.type === 'single-select'
        ? divineOrder.options.map((option) => option.id)
        : [],
    ).toEqual(['protector', 'thaumaturge'])
  })

  it('requires Blessed Strikes at level 7', () => {
    const blessedStrikes = clericSrd2024.choices.find(
      (choice) => choice.id === 'blessed-strikes',
    )

    expect(blessedStrikes?.level).toBe(7)
    expect(blessedStrikes?.type).toBe('single-select')
    expect(
      blessedStrikes?.type === 'single-select'
        ? blessedStrikes.options.map((option) => option.id)
        : [],
    ).toEqual(['divine-strike', 'potent-spellcasting'])
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      clericSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'divine-order', level: 1 },
      { id: 'cleric-subclass', level: 3 },
      { id: 'blessed-strikes', level: 7 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
    ])
  })
})
