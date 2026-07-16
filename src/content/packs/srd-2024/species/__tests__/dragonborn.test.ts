import { describe, expect, it } from 'vitest'
import { DRACONIC_ANCESTRIES, dragonbornSrd2024 } from '../dragonborn'
import { dwarfSrd2024 } from '../dwarf'

describe('dwarfSrd2024', () => {
  it('defines creature type, origin languages, and Darkvision as a trait-owned effect', () => {
    expect(dwarfSrd2024.creatureType).toBe('humanoid')
    expect(dwarfSrd2024.languages).toEqual({
      grants: [{ id: 'common', label: 'Common' }],
      choices: [
        {
          id: 'standard-languages',
          prompt: 'Choose 2 Standard Languages',
          count: 2,
          pool: 'standard',
          required: true,
        },
      ],
    })
    expect(dwarfSrd2024.effects).toEqual([])

    const darkvision = dwarfSrd2024.traits.find(
      (trait) => trait.id === 'darkvision',
    )
    expect(darkvision).toMatchObject({
      name: 'Darkvision',
      effects: [{ kind: 'darkvision', rangeFeet: 120 }],
    })
    expect(dwarfSrd2024.traits.map((trait) => trait.id)).toEqual([
      'darkvision',
      'dwarven-resilience',
      'dwarven-toughness',
      'stonecunning',
    ])
  })
})

describe('dragonbornSrd2024', () => {
  it('defines all 10 dragon-named ancestry options with damage types', () => {
    const choice = dragonbornSrd2024.choices[0]

    expect(choice?.id).toBe('draconic-ancestry')
    expect(choice?.required).toBe(true)
    expect(choice?.options).toHaveLength(10)
    expect(DRACONIC_ANCESTRIES).toEqual([
      { id: 'black', label: 'Black', damageType: 'acid' },
      { id: 'blue', label: 'Blue', damageType: 'lightning' },
      { id: 'brass', label: 'Brass', damageType: 'fire' },
      { id: 'bronze', label: 'Bronze', damageType: 'lightning' },
      { id: 'copper', label: 'Copper', damageType: 'acid' },
      { id: 'gold', label: 'Gold', damageType: 'fire' },
      { id: 'green', label: 'Green', damageType: 'poison' },
      { id: 'red', label: 'Red', damageType: 'fire' },
      { id: 'silver', label: 'Silver', damageType: 'cold' },
      { id: 'white', label: 'White', damageType: 'cold' },
    ])
  })

  it('displays each option label with its associated damage type', () => {
    const options = dragonbornSrd2024.choices[0]?.options ?? []

    expect(options.find((option) => option.id === 'red')?.label).toBe(
      'Red (Fire)',
    )
    expect(options.find((option) => option.id === 'silver')?.label).toBe(
      'Silver (Cold)',
    )
    expect(options.find((option) => option.id === 'blue')?.label).toBe(
      'Blue (Lightning)',
    )
  })

  it('grants matching damage resistance from the selected option effects', () => {
    const red = dragonbornSrd2024.choices[0]?.options.find(
      (option) => option.id === 'red',
    )
    const brass = dragonbornSrd2024.choices[0]?.options.find(
      (option) => option.id === 'brass',
    )

    expect(red?.effects).toEqual([
      { kind: 'damage-resistance', damageType: 'fire' },
    ])
    expect(brass?.effects).toEqual([
      { kind: 'damage-resistance', damageType: 'fire' },
    ])
    expect(red?.id).not.toBe(brass?.id)
  })

  it('keeps breath weapon and draconic flight descriptive-only with Darkvision on a trait', () => {
    expect(dragonbornSrd2024.creatureType).toBe('humanoid')
    expect(dragonbornSrd2024.languages).toEqual(dwarfSrd2024.languages)
    expect(dragonbornSrd2024.traits.map((trait) => trait.id)).toEqual([
      'darkvision',
      'breath-weapon',
      'draconic-flight',
    ])
    expect(dragonbornSrd2024.effects).toEqual([])
    expect(
      dragonbornSrd2024.traits.find((trait) => trait.id === 'darkvision')
        ?.effects,
    ).toEqual([{ kind: 'darkvision', rangeFeet: 60 }])
  })
})
