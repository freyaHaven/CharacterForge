import { describe, expect, it } from 'vitest'
import { createBundledSpeciesCatalog } from './bundledSpeciesCatalog'

describe('createBundledSpeciesCatalog', () => {
  const catalog = createBundledSpeciesCatalog()

  it('lists dwarf for srd-2024', async () => {
    const species = await catalog.listSpecies('srd-2024')

    expect(species).toHaveLength(2)
    expect(species.map((entry) => entry.id)).toEqual([
      'srd-2024:dwarf',
      'srd-2024:dragonborn',
    ])
  })

  it('returns an empty list for srd-2014', async () => {
    await expect(catalog.listSpecies('srd-2014')).resolves.toEqual([])
  })

  it('gets dwarf by stable id', async () => {
    const dwarf = await catalog.getSpecies('srd-2024:dwarf')

    expect(dwarf).not.toBeNull()
    expect(dwarf?.name).toBe('Dwarf')
    expect(dwarf?.size).toBe('medium')
    expect(dwarf?.speed).toEqual({ walk: 30 })
    expect(dwarf?.effects).toEqual([
      { kind: 'darkvision', rangeFeet: 120 },
      { kind: 'damage-resistance', damageType: 'poison' },
      { kind: 'save-advantage', condition: 'poisoned' },
      { kind: 'hit-point-maximum-per-level', amount: 1 },
    ])
    expect(dwarf?.choices).toEqual([])
  })

  it('returns null for an unknown species id', async () => {
    await expect(catalog.getSpecies('srd-2024:unknown')).resolves.toBeNull()
    await expect(catalog.getSpecies('srd-2014:dwarf')).resolves.toBeNull()
  })
})
