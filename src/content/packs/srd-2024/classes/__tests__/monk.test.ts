import { describe, expect, it } from 'vitest'
import { monkSrd2024 } from '../monk'
import {
  ARTISAN_TOOL_IDS,
  MUSICAL_INSTRUMENT_IDS,
} from '../../../../../domain/tools/types'

describe('monkSrd2024', () => {
  it('uses the expected stable id and edition', () => {
    expect(monkSrd2024.id).toBe('srd-2024:monk')
    expect(monkSrd2024.editionId).toBe('srd-2024')
  })

  it('is available in the single-class catalogue', () => {
    expect(monkSrd2024.catalogStatus).toBeUndefined()
    expect(monkSrd2024.catalogOrder).toBe(15)
  })

  it('requires two skill proficiencies', () => {
    const skills = monkSrd2024.choices.find(
      (choice) => choice.id === 'skill-proficiencies',
    )

    expect(skills?.type).toBe('multi-select')
    expect(skills?.type === 'multi-select' ? skills.min : undefined).toBe(2)
    expect(skills?.type === 'multi-select' ? skills.max : undefined).toBe(2)
  })

  it('requires a tool proficiency from artisan tools or instruments', () => {
    const toolChoice = monkSrd2024.choices.find(
      (choice) => choice.id === 'tool-proficiency',
    )

    expect(toolChoice?.type).toBe('single-select')
    expect(
      toolChoice?.type === 'single-select'
        ? toolChoice.options.map((option) => option.id)
        : [],
    ).toEqual([...ARTISAN_TOOL_IDS, ...MUSICAL_INSTRUMENT_IDS])
  })

  it('has no weapon mastery choices', () => {
    expect(
      monkSrd2024.choices.some((choice) =>
        choice.id.startsWith('weapon-mastery'),
      ),
    ).toBe(false)
  })

  it('declares the level at which each choice becomes available', () => {
    expect(
      monkSrd2024.choices.map((choice) => ({
        id: choice.id,
        level: choice.level,
      })),
    ).toEqual([
      { id: 'skill-proficiencies', level: 1 },
      { id: 'tool-proficiency', level: 1 },
      { id: 'monk-subclass', level: 3 },
      { id: 'ability-score-improvement-4', level: 4 },
      { id: 'ability-score-improvement-8', level: 8 },
      { id: 'ability-score-improvement-12', level: 12 },
      { id: 'ability-score-improvement-16', level: 16 },
      { id: 'epic-boon', level: 19 },
    ])
  })
})
