import { describe, expect, it } from 'vitest'
import { DRACONIC_ANCESTRIES, dragonbornSrd2024 } from '../dragonborn'

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

  it('keeps breath weapon and draconic flight descriptive-only', () => {
    expect(dragonbornSrd2024.traits.map((trait) => trait.id)).toEqual([
      'breath-weapon',
      'draconic-flight',
    ])
    expect(dragonbornSrd2024.effects).toEqual([
      { kind: 'darkvision', rangeFeet: 60 },
    ])
  })
})
