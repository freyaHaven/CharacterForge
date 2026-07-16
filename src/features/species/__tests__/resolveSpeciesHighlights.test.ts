import { describe, expect, it } from 'vitest'
import type { SpeciesDefinition } from '../../../domain/species/types'
import { SRD_2024_SOURCE } from '../../../content/packs/srd-2024/source'
import {
  hasSpeciesHighlights,
  resolveSpeciesHighlights,
} from '../resolveSpeciesHighlights'

function createFixture(
  overrides: Partial<SpeciesDefinition> = {},
): SpeciesDefinition {
  return {
    id: 'fixture:species',
    editionId: 'srd-2024',
    name: 'Fixture',
    description: 'A test species.',
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

describe('resolveSpeciesHighlights', () => {
  it('maps darkvision trait effects to senses and ignores resistance effects', () => {
    const definition = createFixture({
      traits: [
        {
          id: 'darkvision',
          name: 'Darkvision',
          description: 'You have Darkvision.',
          effects: [{ kind: 'darkvision', rangeFeet: 120 }],
        },
        {
          id: 'resilience',
          name: 'Resilience',
          description: 'Poison resistance.',
          effects: [
            { kind: 'damage-resistance', damageType: 'poison' },
            { kind: 'save-advantage', condition: 'poisoned' },
          ],
        },
      ],
    })

    expect(resolveSpeciesHighlights(definition)).toEqual({
      senses: [
        { kind: 'darkvision', label: 'Darkvision', detail: '120 ft.' },
      ],
      movement: [],
    })
  })

  it('includes alternate movement speeds but not walk', () => {
    const definition = createFixture({
      speed: { walk: 30, fly: 50, swim: 30, climb: 20, burrow: 10 },
    })

    expect(resolveSpeciesHighlights(definition)).toEqual({
      senses: [],
      movement: [
        { kind: 'fly', label: 'Fly Speed', detail: '50 ft.' },
        { kind: 'swim', label: 'Swim Speed', detail: '30 ft.' },
        { kind: 'climb', label: 'Climb Speed', detail: '20 ft.' },
        { kind: 'burrow', label: 'Burrow Speed', detail: '10 ft.' },
      ],
    })
  })

  it('reports empty highlights when there are no senses or alternate speeds', () => {
    const highlights = resolveSpeciesHighlights(createFixture())

    expect(highlights).toEqual({ senses: [], movement: [] })
    expect(hasSpeciesHighlights(highlights)).toBe(false)
  })
})
