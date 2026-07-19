import { describe, expect, it } from 'vitest'
import { DRACONIC_ANCESTRIES, dragonbornSrd2024 } from '../dragonborn'
import { dwarfSrd2024 } from '../dwarf'
import { elfSrd2024 } from '../elf'
import { gnomeSrd2024 } from '../gnome'
import { goliathSrd2024 } from '../goliath'
import { halflingSrd2024 } from '../halfling'
import { humanSrd2024 } from '../human'
import { orcSrd2024 } from '../orc'
import { tieflingSrd2024 } from '../tiefling'
import { SRD_2024_SPECIES } from '../index'

describe('SRD_2024_SPECIES', () => {
  it('lists all nine species in alphabetical order', () => {
    expect(SRD_2024_SPECIES.map((species) => species.id)).toEqual([
      'srd-2024:dragonborn',
      'srd-2024:dwarf',
      'srd-2024:elf',
      'srd-2024:gnome',
      'srd-2024:goliath',
      'srd-2024:halfling',
      'srd-2024:human',
      'srd-2024:orc',
      'srd-2024:tiefling',
    ])
  })
})

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

describe('elfSrd2024', () => {
  it('requires lineage, keen senses, and spellcasting ability choices', () => {
    expect(elfSrd2024.choices.map((choice) => choice.id)).toEqual([
      'elven-lineage',
      'keen-senses',
      'spellcasting-ability',
    ])
    expect(
      elfSrd2024.choices
        .find((choice) => choice.id === 'elven-lineage')
        ?.options.map((option) => option.id),
    ).toEqual(['drow', 'high-elf', 'wood-elf'])
  })

  it('grants Fey Ancestry save advantage and Drow Darkvision upgrade', () => {
    expect(
      elfSrd2024.traits.find((trait) => trait.id === 'fey-ancestry')?.effects,
    ).toEqual([{ kind: 'save-advantage', condition: 'charmed' }])
    expect(
      elfSrd2024.choices
        .find((choice) => choice.id === 'elven-lineage')
        ?.options.find((option) => option.id === 'drow')?.effects,
    ).toEqual([{ kind: 'darkvision', rangeFeet: 120 }])
  })
})

describe('gnomeSrd2024', () => {
  it('is Small with lineage choices and 60 ft Darkvision', () => {
    expect(gnomeSrd2024.size).toBe('small')
    expect(gnomeSrd2024.choices.map((choice) => choice.id)).toEqual([
      'gnomish-lineage',
      'spellcasting-ability',
    ])
    expect(
      gnomeSrd2024.traits.find((trait) => trait.id === 'darkvision')?.effects,
    ).toEqual([{ kind: 'darkvision', rangeFeet: 60 }])
  })
})

describe('goliathSrd2024', () => {
  it('walks at 35 feet and offers six Giant Ancestry benefits', () => {
    expect(goliathSrd2024.speed).toEqual({ walk: 35 })
    expect(
      goliathSrd2024.choices
        .find((choice) => choice.id === 'giant-ancestry')
        ?.options.map((option) => option.id),
    ).toEqual([
      'clouds-jaunt',
      'fires-burn',
      'frosts-chill',
      'hills-tumble',
      'stones-endurance',
      'storms-thunder',
    ])
  })
})

describe('halflingSrd2024', () => {
  it('is Small with Brave save advantage and no required choices', () => {
    expect(halflingSrd2024.size).toBe('small')
    expect(halflingSrd2024.choices).toEqual([])
    expect(
      halflingSrd2024.traits.find((trait) => trait.id === 'brave')?.effects,
    ).toEqual([{ kind: 'save-advantage', condition: 'frightened' }])
  })
})

describe('humanSrd2024', () => {
  it('requires a size choice and keeps Skillful/Versatile descriptive', () => {
    expect(humanSrd2024.choices.map((choice) => choice.id)).toEqual(['size'])
    expect(humanSrd2024.traits.map((trait) => trait.id)).toEqual([
      'resourceful',
      'skillful',
      'versatile',
    ])
  })
})

describe('orcSrd2024', () => {
  it('grants 120 ft Darkvision with no required choices', () => {
    expect(orcSrd2024.choices).toEqual([])
    expect(
      orcSrd2024.traits.find((trait) => trait.id === 'darkvision')?.effects,
    ).toEqual([{ kind: 'darkvision', rangeFeet: 120 }])
    expect(orcSrd2024.traits.map((trait) => trait.id)).toEqual([
      'adrenaline-rush',
      'darkvision',
      'relentless-endurance',
    ])
  })
})

describe('tieflingSrd2024', () => {
  it('requires size, legacy, and spellcasting ability with resistance effects', () => {
    expect(tieflingSrd2024.choices.map((choice) => choice.id)).toEqual([
      'size',
      'fiendish-legacy',
      'spellcasting-ability',
    ])

    const legacy = tieflingSrd2024.choices.find(
      (choice) => choice.id === 'fiendish-legacy',
    )
    expect(legacy?.options.map((option) => option.id)).toEqual([
      'abyssal',
      'chthonic',
      'infernal',
    ])
    expect(
      legacy?.options.find((option) => option.id === 'abyssal')?.effects,
    ).toEqual([{ kind: 'damage-resistance', damageType: 'poison' }])
    expect(
      legacy?.options.find((option) => option.id === 'chthonic')?.effects,
    ).toEqual([{ kind: 'damage-resistance', damageType: 'necrotic' }])
    expect(
      legacy?.options.find((option) => option.id === 'infernal')?.effects,
    ).toEqual([{ kind: 'damage-resistance', damageType: 'fire' }])
  })
})
