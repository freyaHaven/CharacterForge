import { describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from '../bundledSpeciesCatalog'

describe('createBundledSpeciesCatalog', () => {
  const catalog = createBundledSpeciesCatalog()

  it('lists all SRD 2024 species alphabetically', async () => {
    const species = await catalog.listSpecies('srd-2024')

    expect(species).toHaveLength(9)
    expect(species.map((entry) => entry.id)).toEqual([
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

  it('returns an empty list for srd-2014', async () => {
    await expect(catalog.listSpecies('srd-2014')).resolves.toEqual([])
  })

  it('gets dwarf by stable id', async () => {
    const dwarf = await catalog.getSpecies('srd-2024:dwarf')

    expect(dwarf).not.toBeNull()
    expect(dwarf?.name).toBe('Dwarf')
    expect(dwarf?.creatureType).toBe('humanoid')
    expect(dwarf?.size).toBe('medium')
    expect(dwarf?.speed).toEqual({ walk: 30 })
    expect(dwarf?.languages.grants.map((grant) => grant.label)).toEqual([
      'Common',
    ])
    expect(dwarf?.languages.choices).toEqual([
      {
        id: 'standard-languages',
        prompt: 'Choose 2 Standard Languages',
        count: 2,
        pool: 'standard',
        required: true,
      },
    ])
    expect(dwarf?.effects).toEqual([])
    expect(
      dwarf?.traits.find((trait) => trait.id === 'darkvision')?.effects,
    ).toEqual([{ kind: 'darkvision', rangeFeet: 120 }])
    expect(dwarf?.choices).toEqual([])
  })

  it('gets Dragonborn with stable ancestry choice ids', async () => {
    const dragonborn = await catalog.getSpecies('srd-2024:dragonborn')

    expect(dragonborn).not.toBeNull()
    expect(dragonborn?.name).toBe('Dragonborn')
    expect(dragonborn?.choices).toHaveLength(1)
    expect(dragonborn?.choices[0]?.id).toBe('draconic-ancestry')
    expect(dragonborn?.choices[0]?.required).toBe(true)
    expect(dragonborn?.choices[0]?.options.map((option) => option.id)).toEqual([
      'black',
      'blue',
      'brass',
      'bronze',
      'copper',
      'gold',
      'green',
      'red',
      'silver',
      'white',
    ])
    expect(
      dragonborn?.choices[0]?.options.find((option) => option.id === 'red')
        ?.effects,
    ).toEqual([{ kind: 'damage-resistance', damageType: 'fire' }])
  })

  it('returns null for an unknown species id', async () => {
    await expect(catalog.getSpecies('srd-2024:unknown')).resolves.toBeNull()
    await expect(catalog.getSpecies('srd-2014:dwarf')).resolves.toBeNull()
  })
})
