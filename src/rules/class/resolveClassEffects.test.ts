import { describe, expect, it } from 'vitest'
import { fighterSrd2024 } from '../../data/classes/srd-2024/fighter'
import type { ClassSelection } from '../../domain/class/types'
import { resolveClassEffects } from './resolveClassEffects'

const completeFighterSelection: ClassSelection = {
  classId: 'srd-2024:fighter',
  level: 1,
  choices: {
    'fighting-style': 'great-weapon-fighting',
    'skill-proficiencies': ['athletics', 'intimidation'],
  },
}

describe('resolveClassEffects', () => {
  it('derives structural proficiencies without duplicating them on the definition', () => {
    expect(fighterSrd2024).not.toHaveProperty('effects')

    const effects = resolveClassEffects(fighterSrd2024, completeFighterSelection)

    expect(effects).toContainEqual({ kind: 'hit-die', sides: 10 })
    expect(effects).toContainEqual({
      kind: 'saving-throw-proficiency',
      ability: 'strength',
    })
    expect(effects).toContainEqual({
      kind: 'saving-throw-proficiency',
      ability: 'constitution',
    })
    expect(effects).toContainEqual({
      kind: 'armor-proficiency',
      category: 'heavy',
    })
    expect(effects).toContainEqual({
      kind: 'weapon-proficiency',
      category: 'martial',
    })
  })

  it('adds choice-specific effects without branching on class id', () => {
    const effects = resolveClassEffects(fighterSrd2024, completeFighterSelection)

    expect(effects).toContainEqual({
      kind: 'fighting-style',
      styleId: 'great-weapon-fighting',
    })
    expect(effects).toContainEqual({
      kind: 'skill-proficiency',
      skillId: 'athletics',
    })
    expect(effects).toContainEqual({
      kind: 'skill-proficiency',
      skillId: 'intimidation',
    })
  })
})
