import { describe, expect, it } from 'vitest'
import type { ClassDefinition } from '../../domain/class/types'
import { sortClassesForCatalog } from './sortClassesForCatalog'

const EMPTY_SOURCE = {
  id: 'test',
  name: 'Test',
  version: '1',
  licence: 'test',
  attribution: 'test',
  documentUrl: 'https://example.test',
} as const

function createStubClass(
  id: string,
  name: string,
  catalogOrder?: number,
): ClassDefinition {
  return {
    id,
    editionId: 'srd-2024',
    name,
    description: `${name} stub`,
    source: EMPTY_SOURCE,
    hitDie: { sides: 8 },
    primaryAbilities: ['strength'],
    savingThrows: ['strength'],
    proficiencies: {
      armor: [],
      weapons: ['simple'],
      tools: [],
      skillOptions: [],
    },
    featureProgression: [],
    choices: [],
    deferredRequirements: [],
    ...(catalogOrder === undefined ? {} : { catalogOrder }),
  }
}

describe('sortClassesForCatalog', () => {
  it('orders by catalogOrder then name', () => {
    const sorted = sortClassesForCatalog([
      createStubClass('pack:rogue', 'Rogue', 20),
      createStubClass('pack:artificer', 'Artificer', 30),
      createStubClass('pack:fighter', 'Fighter', 10),
    ])

    expect(sorted.map((entry) => entry.name)).toEqual([
      'Fighter',
      'Rogue',
      'Artificer',
    ])
  })

  it('falls back to name order when catalogOrder is omitted', () => {
    const sorted = sortClassesForCatalog([
      createStubClass('pack:zealot', 'Zealot'),
      createStubClass('pack:warden', 'Warden'),
    ])

    expect(sorted.map((entry) => entry.name)).toEqual(['Warden', 'Zealot'])
  })
})
