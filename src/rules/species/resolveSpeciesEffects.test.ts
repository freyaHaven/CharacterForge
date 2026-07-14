import { describe, expect, it } from 'vitest'
import { dragonbornSrd2024 } from '../../data/species/srd-2024/dragonborn'
import { resolveSpeciesEffects } from './resolveSpeciesEffects'

describe('resolveSpeciesEffects', () => {
  it('resolves Red ancestry to Fire resistance', () => {
    expect(
      resolveSpeciesEffects(dragonbornSrd2024, {
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
      resolveSpeciesEffects(dragonbornSrd2024, {
        speciesId: 'srd-2024:dragonborn',
        choices: { 'draconic-ancestry': 'silver' },
      }),
    ).toEqual([
      { kind: 'darkvision', rangeFeet: 60 },
      { kind: 'damage-resistance', damageType: 'cold' },
    ])
  })

  it('keeps Brass and Red as distinct choices despite shared Fire damage', () => {
    const brass = resolveSpeciesEffects(dragonbornSrd2024, {
      speciesId: 'srd-2024:dragonborn',
      choices: { 'draconic-ancestry': 'brass' },
    })
    const red = resolveSpeciesEffects(dragonbornSrd2024, {
      speciesId: 'srd-2024:dragonborn',
      choices: { 'draconic-ancestry': 'red' },
    })

    expect(brass).toEqual(red)
    expect(
      dragonbornSrd2024.choices[0]?.options.find(
        (option) => option.id === 'brass',
      )?.id,
    ).toBe('brass')
    expect(
      dragonbornSrd2024.choices[0]?.options.find(
        (option) => option.id === 'red',
      )?.id,
    ).toBe('red')
  })
})
