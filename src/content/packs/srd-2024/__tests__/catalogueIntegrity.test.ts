import { describe, expect, it } from 'vitest'
import { createBundledContentRegistry } from '../../../registry/bundledContent'
import { srd2024ContentPack } from '../index'

describe('SRD 2024 catalogue integrity', () => {
  const registry = createBundledContentRegistry()
  const pack = srd2024ContentPack
  const spellIds = new Set(pack.spells.map((spell) => spell.id))
  const featIds = new Set(pack.feats.map((feat) => feat.id))
  const classIds = new Set(pack.classes.map((entry) => entry.id))
  const equipmentIds = new Set(pack.equipment.map((item) => item.id))
  const listIds = new Set(pack.spellLists.map((list) => list.id))

  it('has unique ids within each catalogue', () => {
    expect(new Set(pack.classes.map((entry) => entry.id)).size).toBe(
      pack.classes.length,
    )
    expect(new Set(pack.subclasses.map((entry) => entry.id)).size).toBe(
      pack.subclasses.length,
    )
    expect(new Set(pack.species.map((entry) => entry.id)).size).toBe(
      pack.species.length,
    )
    expect(new Set(pack.backgrounds.map((entry) => entry.id)).size).toBe(
      pack.backgrounds.length,
    )
    expect(featIds.size).toBe(pack.feats.length)
    expect(spellIds.size).toBe(pack.spells.length)
    expect(listIds.size).toBe(pack.spellLists.length)
    expect(equipmentIds.size).toBe(pack.equipment.length)
  })

  it('ships exactly 12 classes, 12 subclasses, 9 species, 4 backgrounds, 19 feats', () => {
    expect(pack.classes).toHaveLength(12)
    expect(pack.subclasses).toHaveLength(12)
    expect(pack.species).toHaveLength(9)
    expect(pack.backgrounds).toHaveLength(4)
    expect(pack.feats).toHaveLength(19)
  })

  it('resolves every subclass classId', () => {
    for (const subclass of pack.subclasses) {
      expect(classIds.has(subclass.classId), subclass.id).toBe(true)
      expect(registry.getClass(subclass.classId)?.id).toBe(subclass.classId)
    }
  })

  it('resolves every background origin featId', () => {
    for (const background of pack.backgrounds) {
      expect(featIds.has(background.originFeat.featId), background.id).toBe(
        true,
      )
    }
  })

  it('resolves every spell list entry to a spell definition', () => {
    const missing: string[] = []
    for (const list of pack.spellLists) {
      for (const spellId of list.spellIds) {
        if (!spellIds.has(spellId)) {
          missing.push(`${list.id} → ${spellId}`)
        }
      }
    }
    expect(missing).toEqual([])
  })

  it('resolves class spellcasting list ids', () => {
    for (const classDef of pack.classes) {
      if (classDef.spellcasting === undefined) {
        continue
      }
      expect(
        listIds.has(classDef.spellcasting.spellListId),
        classDef.id,
      ).toBe(true)
    }
  })

  it('resolves recommended epic-boon feat ids on classes', () => {
    for (const classDef of pack.classes) {
      const epic = classDef.choices.find((choice) => choice.id === 'epic-boon')
      if (
        epic === undefined ||
        epic.type !== 'single-select' ||
        epic.recommendedFeatId === undefined
      ) {
        continue
      }
      expect(
        featIds.has(epic.recommendedFeatId),
        `${classDef.id} → ${epic.recommendedFeatId}`,
      ).toBe(true)
    }
  })

  it('resolves starting-equipment package item refs', () => {
    const missing: string[] = []
    for (const classDef of pack.classes) {
      walkEquipment(classDef.startingEquipment, (itemId) => {
        if (!equipmentIds.has(itemId) && !itemId.startsWith('selected:')) {
          missing.push(`${classDef.id} → ${itemId}`)
        }
      })
    }
    for (const background of pack.backgrounds) {
      walkEquipment(background.equipment, (itemId) => {
        if (!equipmentIds.has(itemId) && !itemId.startsWith('selected:')) {
          missing.push(`${background.id} → ${itemId}`)
        }
      })
    }
    expect(missing).toEqual([])
  })
})

function walkEquipment(
  node: unknown,
  visitItemId: (itemId: string) => void,
): void {
  if (node === null || typeof node !== 'object') {
    return
  }

  if (Array.isArray(node)) {
    for (const entry of node) {
      walkEquipment(entry, visitItemId)
    }
    return
  }

  const record = node as Record<string, unknown>
  if (typeof record.itemId === 'string') {
    visitItemId(record.itemId)
  }
  if (typeof record.id === 'string' && record.kind === 'item') {
    visitItemId(record.id)
  }

  for (const value of Object.values(record)) {
    walkEquipment(value, visitItemId)
  }
}
