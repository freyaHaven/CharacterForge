import { describe, expect, it } from 'vitest'
import { clericSrd2024 } from '../../../content/packs/srd-2024/classes/cleric'
import { druidSrd2024 } from '../../../content/packs/srd-2024/classes/druid'
import { fighterSrd2024 } from '../../../content/packs/srd-2024/classes/fighter'
import type { ClassSelection } from '../../../domain/class/types'
import { createTestClassSpellcasting } from '../../../testing/createTestClassSpellcasting'
import { resolveClassEffects } from '../resolveClassEffects'

const completeFighterSelection: ClassSelection = {
  classId: 'srd-2024:fighter',
  level: 1,
  choices: {
    'fighting-style': 'great-weapon-fighting',
    'skill-proficiencies': ['athletics', 'intimidation'],
    'weapon-mastery': ['longsword', 'shortbow', 'battleaxe'],
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

  it('adds choice-specific skill effects without branching on class id', () => {
    const effects = resolveClassEffects(fighterSrd2024, completeFighterSelection)

    expect(effects).toContainEqual({
      kind: 'skill-proficiency',
      skillId: 'athletics',
    })
    expect(effects).toContainEqual({
      kind: 'skill-proficiency',
      skillId: 'intimidation',
    })
    // Fighting Styles are feat grants — not class option effects.
    expect(effects.some((effect) => effect.kind === 'fighting-style')).toBe(
      false,
    )
  })

  it('includes spellcasting when the class definition grants it', () => {
    const effects = resolveClassEffects(
      {
        ...fighterSrd2024,
        spellcasting: createTestClassSpellcasting({ ability: 'intelligence' }),
      },
      completeFighterSelection,
    )

    expect(effects).toContainEqual({
      kind: 'spellcasting',
      ability: 'intelligence',
    })
  })

  it('applies feature progression effects and choice armor without duplicates', () => {
    const effects = resolveClassEffects(druidSrd2024, {
      classId: 'srd-2024:druid',
      level: 1,
      choices: {
        'skill-proficiencies': ['nature', 'perception'],
        'primal-order': 'warden',
      },
    })

    expect(effects).toContainEqual({
      kind: 'language',
      languageId: 'druidic',
      label: 'Druidic',
    })
    expect(effects).toContainEqual({
      kind: 'tool-proficiency',
      toolId: 'herbalism-kit',
      label: 'Herbalism Kit',
    })
    expect(effects).toContainEqual({
      kind: 'armor-proficiency',
      category: 'medium',
    })
    expect(
      effects.filter(
        (effect) =>
          effect.kind === 'armor-proficiency' && effect.category === 'light',
      ),
    ).toHaveLength(1)
  })

  it('applies Cleric Protector heavy armor and martial weapons', () => {
    const effects = resolveClassEffects(clericSrd2024, {
      classId: 'srd-2024:cleric',
      level: 1,
      choices: {
        'skill-proficiencies': ['insight', 'religion'],
        'divine-order': 'protector',
      },
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
})
