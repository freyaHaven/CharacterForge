import { describe, expect, it } from 'vitest'
import type { ClassDefinition } from '../../domain/class/types'
import { filterClassesByName } from './filterClassesByName'

const fighter: ClassDefinition = {
  id: 'srd-2024:fighter',
  editionId: 'srd-2024',
  name: 'Fighter',
  description: 'A martial class.',
  source: {
    id: 'srd-2024',
    name: 'SRD',
    version: '5.2.1',
    licence: 'CC-BY-4.0',
    attribution: 'Test',
    documentUrl: 'https://example.com',
  },
  hitDie: { sides: 10 },
  primaryAbilities: ['strength'],
  savingThrows: ['strength', 'constitution'],
  proficiencies: {
    armor: ['light'],
    weapons: ['simple'],
    tools: [],
    skillOptions: ['athletics'],
  },
  featureProgression: [],
  choices: [],
}

describe('filterClassesByName', () => {
  it('returns all classes when the query is empty', () => {
    expect(filterClassesByName([fighter], '   ')).toEqual([fighter])
  })

  it('filters by case-insensitive name match', () => {
    expect(filterClassesByName([fighter], 'fight')).toEqual([fighter])
    expect(filterClassesByName([fighter], 'rogue')).toEqual([])
  })
})
