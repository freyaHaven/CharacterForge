import { describe, expect, it } from 'vitest'
import {
  buildCharacterContextDisplay,
  hasCharacterContextContent,
  mergePrimaryAbilities,
} from '../characterContextDisplay'

describe('buildCharacterContextDisplay', () => {
  it('formats identity and build lines for a complete single-class selection', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [
        {
          classId: 'srd-2024:fighter',
          className: 'Fighter',
          level: 1,
          subclassLabel: 'Champion',
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'background',
    })

    expect(display.speciesId).toBe('srd-2024:human')
    expect(display.identityLine).toBe('Elara • Human')
    expect(display.buildLine).toBe('Fighter 1')
    expect(display.classEntries[0]?.classId).toBe('srd-2024:fighter')
    expect(display.guidanceLine).toBeNull()
  })

  it('omits the build line on the class step to avoid duplicating page content', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [
        {
          classId: 'srd-2024:fighter',
          className: 'Fighter',
          level: 1,
          subclassLabel: null,
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'class',
    })

    expect(display.identityLine).toBe('Elara • Human')
    expect(display.buildLine).toBeNull()
    expect(display.guidanceLine).toBeNull()
  })

  it('omits class and guidance lines when no class is selected', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [],
      primaryAbilities: [],
      activeStepId: 'class',
    })

    expect(display.identityLine).toBe('Elara • Human')
    expect(display.buildLine).toBeNull()
    expect(display.guidanceLine).toBeNull()
  })

  it('shows only the character name on the species step', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Freya',
      speciesId: 'srd-2024:dwarf',
      speciesName: 'Dwarf',
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
      speciesId: null,
      speciesName: null,
      classEntries: [],
      primaryAbilities: [],
      activeStepId: 'species',
    })

    expect(display.identityLine).toBeNull()
    expect(display.buildLine).toBeNull()
    expect(display.guidanceLine).toBeNull()
    expect(hasCharacterContextContent(display)).toBe(false)
  })

  it('formats multiclass allocations on one build line', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [
        {
          classId: 'srd-2024:fighter',
          className: 'Fighter',
          level: 3,
          subclassLabel: 'Champion',
        },
        {
          classId: 'srd-2024:rogue',
          className: 'Rogue',
          level: 2,
          subclassLabel: null,
        },
        {
          classId: 'srd-2024:wizard',
          className: 'Wizard',
          level: 1,
          subclassLabel: null,
        },
      ],
      primaryAbilities: ['strength', 'dexterity'],
      activeStepId: 'background',
    })

    expect(display.identityLine).toBe('Elara • Human')
    expect(display.buildLine).toBe('Fighter 3 • Rogue 2 • Wizard 1')
    expect(display.guidanceLine).toBeNull()
  })

  it('shows prioritise guidance only on the ability scores step', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [
        {
          classId: 'srd-2024:fighter',
          className: 'Fighter',
          level: 1,
          subclassLabel: null,
        },
      ],
      primaryAbilities: ['strength', 'constitution'],
      activeStepId: 'ability-scores',
    })

    expect(display.identityLine).toBe('Elara • Human')
    expect(display.buildLine).toBe('Fighter 1')
    expect(display.guidanceLine).toBe(
      'Prioritise: Strength • Constitution',
    )
  })

  it('uses singular prioritise wording for one primary ability', () => {
    const display = buildCharacterContextDisplay({
      characterName: 'Elara',
      speciesId: 'srd-2024:human',
      speciesName: 'Human',
      classEntries: [
        {
          classId: 'srd-2024:wizard',
          className: 'Wizard',
          level: 1,
          subclassLabel: null,
        },
      ],
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
