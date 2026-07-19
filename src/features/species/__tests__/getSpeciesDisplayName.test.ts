import { describe, expect, it } from 'vitest'
import type { SpeciesDefinition } from '../../../domain/species/types'
import { SRD_2024_SOURCE } from '../../../content/packs/srd-2024/source'
import {
  formatSpeciesDisplayName,
  getSpeciesDisplayName,
  lineageIncludesSpeciesName,
  lineageLabelForDisplay,
  resolveSelectedLineageLabel,
} from '../getSpeciesDisplayName'

function createDefinition(
  overrides: Partial<SpeciesDefinition> = {},
): SpeciesDefinition {
  return {
    id: 'srd-2024:fixture',
    editionId: 'srd-2024',
    name: 'Fixture',
    description: 'Test species.',
    source: SRD_2024_SOURCE,
    creatureType: 'humanoid',
    size: 'medium',
    speed: { walk: 30 },
    languages: { grants: [], choices: [] },
    traits: [],
    effects: [],
    choices: [],
    ...overrides,
  }
}

describe('formatSpeciesDisplayName', () => {
  it('formats Black + Dragonborn as Black Dragonborn', () => {
    expect(formatSpeciesDisplayName('Dragonborn', 'Black')).toBe(
      'Black Dragonborn',
    )
  })

  it('formats Infernal + Tiefling as Infernal Tiefling', () => {
    expect(formatSpeciesDisplayName('Tiefling', 'Infernal')).toBe(
      'Infernal Tiefling',
    )
  })

  it('returns Storm Giant alone when it already contains Giant', () => {
    expect(formatSpeciesDisplayName('Giant', 'Storm Giant')).toBe('Storm Giant')
  })

  it('returns Wood Elf alone when it already contains Elf', () => {
    expect(formatSpeciesDisplayName('Elf', 'Wood Elf')).toBe('Wood Elf')
  })

  it('does not duplicate Elf for Wood-Elf', () => {
    expect(formatSpeciesDisplayName('Elf', 'Wood-Elf')).toBe('Wood-Elf')
  })

  it('matches species containment case-insensitively', () => {
    expect(lineageIncludesSpeciesName('wood elf', 'ELF')).toBe(true)
    expect(formatSpeciesDisplayName('ELF', 'wood elf')).toBe('wood elf')
    expect(formatSpeciesDisplayName('dragonborn', 'BLACK')).toBe(
      'BLACK dragonborn',
    )
  })

  it('retains the normal species name when no lineage is selected', () => {
    expect(formatSpeciesDisplayName('Dragonborn', null)).toBe('Dragonborn')
    expect(formatSpeciesDisplayName('Dragonborn', undefined)).toBe('Dragonborn')
    expect(formatSpeciesDisplayName('Dragonborn', '')).toBe('Dragonborn')
    expect(formatSpeciesDisplayName('Dragonborn', '   ')).toBe('Dragonborn')
  })
})

describe('getSpeciesDisplayName', () => {
  it('derives display names from ancestry/lineage choices without mutating storage', () => {
    const definition = createDefinition({
      id: 'srd-2024:dragonborn',
      name: 'Dragonborn',
      choices: [
        {
          id: 'draconic-ancestry',
          prompt: 'Choose ancestry',
          type: 'single-select',
          required: true,
          options: [
            { id: 'black', label: 'Black (Acid)' },
            { id: 'red', label: 'Red (Fire)' },
          ],
        },
        {
          id: 'spellcasting-ability',
          prompt: 'Ability',
          type: 'single-select',
          required: false,
          options: [{ id: 'charisma', label: 'Charisma' }],
        },
      ],
    })

    const choices = {
      'draconic-ancestry': 'black',
      'spellcasting-ability': 'charisma',
    }
    const choicesBefore = structuredClone(choices)

    expect(getSpeciesDisplayName(definition, choices)).toBe('Black Dragonborn')
    expect(choices).toEqual(choicesBefore)
    expect(definition.id).toBe('srd-2024:dragonborn')
    expect(choices['draconic-ancestry']).toBe('black')
  })

  it('uses Wood Elf / Infernal Tiefling rules from real option labels', () => {
    expect(
      getSpeciesDisplayName(
        createDefinition({
          name: 'Elf',
          choices: [
            {
              id: 'elven-lineage',
              prompt: 'Lineage',
              type: 'single-select',
              required: true,
              options: [{ id: 'wood-elf', label: 'Wood Elf' }],
            },
          ],
        }),
        { 'elven-lineage': 'wood-elf' },
      ),
    ).toBe('Wood Elf')

    expect(
      getSpeciesDisplayName(
        createDefinition({
          name: 'Tiefling',
          choices: [
            {
              id: 'fiendish-legacy',
              prompt: 'Legacy',
              type: 'single-select',
              required: true,
              options: [{ id: 'infernal', label: 'Infernal' }],
            },
          ],
        }),
        { 'fiendish-legacy': 'infernal' },
      ),
    ).toBe('Infernal Tiefling')
  })

  it('returns the base species name when ancestry is unset', () => {
    const definition = createDefinition({
      name: 'Dragonborn',
      choices: [
        {
          id: 'draconic-ancestry',
          prompt: 'Choose ancestry',
          type: 'single-select',
          required: true,
          options: [{ id: 'black', label: 'Black (Acid)' }],
        },
      ],
    })

    expect(getSpeciesDisplayName(definition, {})).toBe('Dragonborn')
  })
})

describe('lineageLabelForDisplay', () => {
  it('strips single-token parenthetical metadata', () => {
    expect(lineageLabelForDisplay('Black (Acid)')).toBe('Black')
  })

  it('uses multi-word parenthetical ancestry names', () => {
    expect(lineageLabelForDisplay("Storm's Thunder (Storm Giant)")).toBe(
      'Storm Giant',
    )
  })
})

describe('resolveSelectedLineageLabel', () => {
  it('ignores non-ancestry choices such as spellcasting ability', () => {
    const definition = createDefinition({
      choices: [
        {
          id: 'elven-lineage',
          prompt: 'Lineage',
          type: 'single-select',
          required: true,
          options: [{ id: 'drow', label: 'Drow' }],
        },
        {
          id: 'spellcasting-ability',
          prompt: 'Ability',
          type: 'single-select',
          required: true,
          options: [{ id: 'intelligence', label: 'Intelligence' }],
        },
      ],
    })

    expect(
      resolveSelectedLineageLabel(definition, {
        'elven-lineage': 'drow',
        'spellcasting-ability': 'intelligence',
      }),
    ).toBe('Drow')
  })
})
