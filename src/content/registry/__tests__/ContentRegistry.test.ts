import { describe, expect, it } from 'vitest'
import { createBundledContentRegistry } from '../bundledContent'

describe('ContentRegistry (bundled)', () => {
  it('registers the SRD 2024 pack and resolves classes', () => {
    const registry = createBundledContentRegistry()

    expect(registry.listPacks().map((pack) => pack.id)).toEqual(['srd-2024'])
    expect(registry.getClass('srd-2024:fighter')?.name).toBe('Fighter')
    expect(registry.getClass('srd-2024:barbarian')?.name).toBe('Barbarian')
    expect(registry.getClass('srd-2024:rogue')?.name).toBe('Rogue')
    expect(registry.getClass('srd-2024:monk')?.name).toBe('Monk')
    expect(registry.getClass('srd-2024:ranger')?.name).toBe('Ranger')
    expect(registry.getClass('srd-2024:paladin')?.name).toBe('Paladin')
    expect(registry.getClass('srd-2024:cleric')?.name).toBe('Cleric')
    expect(registry.getClass('srd-2024:druid')?.name).toBe('Druid')
    expect(registry.getClass('srd-2024:wizard')?.name).toBe('Wizard')
    expect(registry.getClass('srd-2024:bard')?.name).toBe('Bard')
    expect(registry.listClasses('srd-2024').map((entry) => entry.id)).toEqual([
      'srd-2024:fighter',
      'srd-2024:barbarian',
      'srd-2024:rogue',
      'srd-2024:monk',
      'srd-2024:ranger',
      'srd-2024:paladin',
      'srd-2024:cleric',
      'srd-2024:druid',
      'srd-2024:wizard',
      'srd-2024:bard',
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
    expect(registry.getSubclass('srd-2024:thief')).toMatchObject({
      choiceOptionId: 'thief',
      classId: 'srd-2024:rogue',
      name: 'Thief',
    })
    expect(registry.getSubclass('srd-2024:warrior-of-the-open-hand')).toMatchObject(
      {
        choiceOptionId: 'warrior-of-the-open-hand',
        classId: 'srd-2024:monk',
        name: 'Warrior of the Open Hand',
      },
    )
    expect(registry.getSubclass('srd-2024:hunter')).toMatchObject({
      choiceOptionId: 'hunter',
      classId: 'srd-2024:ranger',
      name: 'Hunter',
    })
    expect(registry.getSubclass('srd-2024:oath-of-devotion')).toMatchObject({
      choiceOptionId: 'oath-of-devotion',
      classId: 'srd-2024:paladin',
      name: 'Oath of Devotion',
    })
    expect(registry.getSubclass('srd-2024:life-domain')).toMatchObject({
      choiceOptionId: 'life-domain',
      classId: 'srd-2024:cleric',
      name: 'Life Domain',
    })
    expect(registry.getSubclass('srd-2024:circle-of-the-land')).toMatchObject({
      choiceOptionId: 'circle-of-the-land',
      classId: 'srd-2024:druid',
      name: 'Circle of the Land',
    })
    expect(registry.getSubclass('srd-2024:evoker')).toMatchObject({
      choiceOptionId: 'evoker',
      classId: 'srd-2024:wizard',
      name: 'Evoker',
    })
    expect(registry.getSubclass('srd-2024:college-of-lore')).toMatchObject({
      choiceOptionId: 'college-of-lore',
      classId: 'srd-2024:bard',
      name: 'College of Lore',
    })
    expect(
      registry.listSubclasses('srd-2024:fighter').map((entry) => entry.id),
    ).toEqual(['srd-2024:champion'])
    expect(
      registry.listSubclasses('srd-2024:rogue').map((entry) => entry.id),
    ).toEqual(['srd-2024:thief'])
    expect(
      registry.listSubclasses('srd-2024:monk').map((entry) => entry.id),
    ).toEqual(['srd-2024:warrior-of-the-open-hand'])
    expect(
      registry.listSubclasses('srd-2024:ranger').map((entry) => entry.id),
    ).toEqual(['srd-2024:hunter'])
    expect(
      registry.listSubclasses('srd-2024:paladin').map((entry) => entry.id),
    ).toEqual(['srd-2024:oath-of-devotion'])
    expect(
      registry.listSubclasses('srd-2024:cleric').map((entry) => entry.id),
    ).toEqual(['srd-2024:life-domain'])
    expect(
      registry.listSubclasses('srd-2024:druid').map((entry) => entry.id),
    ).toEqual(['srd-2024:circle-of-the-land'])
    expect(
      registry.listSubclasses('srd-2024:wizard').map((entry) => entry.id),
    ).toEqual(['srd-2024:evoker'])
    expect(
      registry.listSubclasses('srd-2024:bard').map((entry) => entry.id),
    ).toEqual(['srd-2024:college-of-lore'])
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
      'srd-2024:ability-score-improvement',
      'srd-2024:alert',
      'srd-2024:archery',
      'srd-2024:boon-of-combat-prowess',
      'srd-2024:boon-of-dimensional-travel',
      'srd-2024:boon-of-fate',
      'srd-2024:boon-of-irresistible-offense',
      'srd-2024:boon-of-spell-recall',
      'srd-2024:boon-of-the-night-spirit',
      'srd-2024:boon-of-truesight',
      'srd-2024:defense',
      'srd-2024:grappler',
      'srd-2024:great-weapon-fighting',
      'srd-2024:magic-initiate-cleric',
      'srd-2024:magic-initiate-wizard',
      'srd-2024:savage-attacker',
      'srd-2024:skilled',
      'srd-2024:two-weapon-fighting',
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
    expect(registry.listSpecies('srd-2014')).toEqual([])
    expect(registry.getSpecies('srd-2024:dwarf')?.name).toBe('Dwarf')
    expect(
      registry.getSpecies('srd-2024:dragonborn')?.choices[0]?.id,
    ).toBe('draconic-ancestry')
    expect(registry.getSpecies('srd-2024:elf')?.name).toBe('Elf')
    expect(registry.getSpecies('srd-2024:tiefling')?.choices.map((c) => c.id)).toEqual(
      ['size', 'fiendish-legacy', 'spellcasting-ability'],
    )
  })
})
