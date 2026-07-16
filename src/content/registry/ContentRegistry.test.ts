import { describe, expect, it } from 'vitest'
import { createBundledContentRegistry } from './bundledContent'

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
})
