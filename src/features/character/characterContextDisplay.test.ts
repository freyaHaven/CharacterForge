import { describe, expect, it } from 'vitest'
import {
  buildCharacterContextDisplay,
  hasCharacterContextContent,
  mergePrimaryAbilities,
} from './characterContextDisplay'

describe('buildCharacterContextDisplay', () => {
  it('formats identity and build lines for a complete single-class selection', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 1,
      classEntries: [
        {
          className: 'Fighter',
          level: 1,
          subclassLabel: 'Champion',
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'class',
    })

    expect(display.identityLine).toBe('Elara · Human')
    expect(display.buildLine).toBe('Fighter 1 · Champion')
    expect(display.guidanceLine).toBe(
      'Primary abilities: Strength, Dexterity',
    )
  })

  it('omits class and guidance lines when no class is selected', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 1,
      classEntries: [],
      primaryAbilities: [],
      activeStepId: 'class',
    })

    expect(display.identityLine).toBe('Elara · Human')
    expect(display.buildLine).toBeNull()
    expect(display.guidanceLine).toBeNull()
  })

  it('shows only the character name when species is not selected yet', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Freya',
      speciesName: null,
      targetLevel: 1,
      classEntries: [],
      primaryAbilities: [],
      activeStepId: 'species',
    })

    expect(display.identityLine).toBe('Freya')
    expect(display.buildLine).toBeNull()
    expect(hasCharacterContextContent(display)).toBe(true)
  })

  it('returns no lines when nothing has been entered yet', () => {
    const display = buildCharacterContextDisplay({
      characterName: '   ',
      speciesName: null,
      targetLevel: 1,
      classEntries: [],
      primaryAbilities: [],
      activeStepId: 'species',
    })

    expect(display.identityLine).toBeNull()
    expect(display.buildLine).toBeNull()
    expect(display.guidanceLine).toBeNull()
    expect(hasCharacterContextContent(display)).toBe(false)
  })

  it('omits subclass when none is selected', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 1,
      classEntries: [
        {
          className: 'Fighter',
          level: 1,
          subclassLabel: null,
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'class',
    })

    expect(display.buildLine).toBe('Fighter 1')
  })

  it('formats multiclass allocations on separate lines', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 5,
      classEntries: [
        { className: 'Fighter', level: 3, subclassLabel: 'Champion' },
        { className: 'Rogue', level: 2, subclassLabel: null },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'review',
    })

    expect(display.identityLine).toBe('Elara · Human')
    expect(display.buildLine).toBe('Fighter 3 / Rogue 2')
    expect(display.characterLevelLine).toBe('Character level: 5')
    expect(display.guidanceLine).toBe(
      'Primary abilities: Strength, Dexterity',
    )
  })

  it('uses prioritise wording on the ability scores step', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 1,
      classEntries: [
        {
          className: 'Fighter',
          level: 1,
          subclassLabel: null,
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'ability-scores',
    })

    expect(display.guidanceLine).toBe(
      'Prioritise: Strength or Dexterity',
    )
  })

  it('uses singular prioritise wording for one primary ability', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesName: 'Human',
      targetLevel: 1,
      classEntries: [{ className: 'Wizard', level: 1, subclassLabel: null }],
      primaryAbilities: ['intelligence'],
      activeStepId: 'ability-scores',
    })

    expect(display.guidanceLine).toBe('Prioritise: Intelligence')
  })
})

describe('mergePrimaryAbilities', () => {
  it('deduplicates abilities while preserving order', () => {
    expect(
      mergePrimaryAbilities([
        ['strength', 'dexterity'],
        ['dexterity', 'constitution'],
      ]),
    ).toEqual(['strength', 'dexterity', 'constitution'])
  })
})
