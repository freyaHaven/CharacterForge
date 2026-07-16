import { beforeAll, describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from '../../../adapters/bundledSpeciesCatalog'
import type { SpeciesDefinition } from '../../../domain/species/types'
import { resolveSpeciesEffects } from '../resolveSpeciesEffects'

describe('resolveSpeciesEffects', () => {
  let dragonborn: SpeciesDefinition

  beforeAll(async () => {
    const definition = await createBundledSpeciesCatalog().getSpecies(
      'srd-2024:dragonborn',
    )
    expect(definition).not.toBeNull()
    dragonborn = definition!
  })

  it('resolves Red ancestry to Fire resistance', () => {
    expect(
      resolveSpeciesEffects(dragonborn, {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'red' },
      }),
    ).toEqual([
      { kind: 'darkvision', rangeFeet: 60 },
      { kind: 'damage-resistance', damageType: 'fire' },
    ])
  })

  it('resolves Silver ancestry to Cold resistance', () => {
    expect(
      resolveSpeciesEffects(dragonborn, {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'silver' },
      }),
    ).toEqual([
      { kind: 'darkvision', rangeFeet: 60 },
      { kind: 'damage-resistance', damageType: 'cold' },
    ])
  })

  it('keeps Brass and Red as distinct choices despite shared Fire damage', () => {
    const brass = resolveSpeciesEffects(dragonborn, {
      speciesId: 'srd-2024:dragonborn',
      choices: { 'draconic-ancestry': 'brass' },
    })
    const red = resolveSpeciesEffects(dragonborn, {
      speciesId: 'srd-2024:dragonborn',
      choices: { 'draconic-ancestry': 'red' },
    })

    expect(brass).toEqual(red)
    expect(
      dragonborn.choices[0]?.options.find((option) => option.id === 'brass')
        ?.id,
    ).toBe('brass')
    expect(
      dragonborn.choices[0]?.options.find((option) => option.id === 'red')?.id,
    ).toBe('red')
  })
})
