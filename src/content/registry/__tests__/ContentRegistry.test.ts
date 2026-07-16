import { describe, expect, it } from 'vitest'
import { createBundledContentRegistry } from '../bundledContent'

describe('ContentRegistry (bundled)', () => {
  it('registers the SRD 2024 pack and resolves classes', () => {
    const registry = createBundledContentRegistry()

    expect(registry.listPacks().map((pack) => pack.id)).toEqual(['srd-2024'])
    expect(registry.getClass('srd-2024:fighter')?.name).toBe('Fighter')
    expect(registry.getClass('srd-2024:barbarian')?.name).toBe('Barbarian')
    expect(registry.listClasses('srd-2024').map((entry) => entry.id)).toEqual([
      'srd-2024:fighter',
      'srd-2024:barbarian',
    ])
    expect(registry.listClasses('srd-2014')).toEqual([])
  })

  it('resolves subclasses independently of parent class files', () => {
    const registry = createBundledContentRegistry()

    expect(registry.getSubclass('srd-2024:champion')).toMatchObject({
      choiceOptionId: 'champion',
      classId: 'srd-2024:fighter',
      name: 'Champion',
    })
    expect(registry.getSubclass('srd-2024:path-of-the-berserker')).toMatchObject(
      {
        choiceOptionId: 'path-of-the-berserker',
        classId: 'srd-2024:barbarian',
        name: 'Path of the Berserker',
      },
    )
    expect(
      registry.listSubclasses('srd-2024:fighter').map((entry) => entry.id),
    ).toEqual(['srd-2024:champion'])
  })

  it('keeps subclass choice option ids stable for persistence', () => {
    const registry = createBundledContentRegistry()
    const fighter = registry.getClass('srd-2024:fighter')
    const subclassChoice = fighter?.choices.find(
      (choice) => choice.id === 'fighter-subclass',
    )

    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options.map((option) => option.id)
        : [],
    ).toEqual(['champion'])
  })

  it('assembles subclass choice options from pack subclasses at registration', () => {
    const registry = createBundledContentRegistry()
    const fighter = registry.getClass('srd-2024:fighter')
    const champion = registry.getSubclass('srd-2024:champion')
    const subclassChoice = fighter?.choices.find(
      (choice) => choice.id === 'fighter-subclass',
    )

    expect(champion).not.toBeNull()
    expect(
      subclassChoice?.type === 'single-select'
        ? subclassChoice.options[0]
        : null,
    ).toMatchObject({
      id: champion!.choiceOptionId,
      label: champion!.name,
      features: champion!.features,
    })
  })

  it('indexes bundled feats for lookup and edition listing', () => {
    const registry = createBundledContentRegistry()

    expect(registry.listFeats('srd-2024').map((feat) => feat.id)).toEqual([
      'srd-2024:alert',
      'srd-2024:magic-initiate-cleric',
      'srd-2024:magic-initiate-wizard',
      'srd-2024:savage-attacker',
    ])
    expect(registry.listFeats('srd-2014')).toEqual([])
    expect(registry.getFeat('srd-2024:alert')?.name).toBe('Alert')
    expect(registry.getFeat('srd-2014:alert')).toBeNull()
  })

  it('indexes bundled backgrounds for lookup and edition listing', () => {
    const registry = createBundledContentRegistry()

    expect(registry.listBackgrounds('srd-2024').map((entry) => entry.id)).toEqual([
      'srd-2024:acolyte',
      'srd-2024:criminal',
      'srd-2024:sage',
      'srd-2024:soldier',
    ])
    expect(registry.listBackgrounds('srd-2014')).toEqual([])
    expect(registry.getBackground('srd-2024:soldier')?.originFeat.featId).toBe(
      'srd-2024:savage-attacker',
    )
  })

  it('indexes bundled species for lookup and edition listing', () => {
    const registry = createBundledContentRegistry()

    expect(registry.listSpecies('srd-2024').map((entry) => entry.id)).toEqual([
      'srd-2024:dwarf',
      'srd-2024:dragonborn',
    ])
    expect(registry.listSpecies('srd-2014')).toEqual([])
    expect(registry.getSpecies('srd-2024:dwarf')?.name).toBe('Dwarf')
    expect(
      registry.getSpecies('srd-2024:dragonborn')?.choices[0]?.id,
    ).toBe('draconic-ancestry')
  })
})
