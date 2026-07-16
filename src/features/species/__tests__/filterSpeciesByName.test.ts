import { describe, expect, it } from 'vitest'
import type { SpeciesDefinition } from '../../../domain/species/types'
import { filterSpeciesByName } from '../filterSpeciesByName'

const sampleSpecies: SpeciesDefinition[] = [
  {
    id: 'srd-2024:dwarf',
    editionId: 'srd-2024',
    name: 'Dwarf',
    description: 'Bold and hardy.',
    source: {
      id: 'srd-2024',
      name: 'SRD',
      version: '2024',
      licence: 'cc',
      attribution: 'test',
      documentUrl: 'https://example.com',
    },
    size: 'medium',
    speed: { walk: 30 },
    traits: [],
    effects: [],
    choices: [],
  },
  {
    id: 'srd-2024:dragonborn',
    editionId: 'srd-2024',
    name: 'Dragonborn',
    description: 'Draconic heritage.',
    source: {
      id: 'srd-2024',
      name: 'SRD',
      version: '2024',
      licence: 'cc',
      attribution: 'test',
      documentUrl: 'https://example.com',
    },
    size: 'medium',
    speed: { walk: 30 },
    traits: [],
    effects: [],
    choices: [],
  },
]

describe('filterSpeciesByName', () => {
  it('returns all species for an empty query', () => {
    expect(filterSpeciesByName(sampleSpecies, '')).toEqual(sampleSpecies)
    expect(filterSpeciesByName(sampleSpecies, '   ')).toEqual(sampleSpecies)
  })

  it('filters by species name case-insensitively', () => {
    expect(filterSpeciesByName(sampleSpecies, 'dwa')).toEqual([sampleSpecies[0]])
    expect(filterSpeciesByName(sampleSpecies, 'DRAGON')).toEqual([sampleSpecies[1]])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterSpeciesByName(sampleSpecies, 'elf')).toEqual([])
  })
})
