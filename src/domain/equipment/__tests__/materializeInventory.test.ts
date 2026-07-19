import { describe, expect, it } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { createDefaultCharacter } from '../../character/defaults'
import {
  assignDefaultLocations,
  materializeInventoryEntries,
} from '../materializeInventory'

describe('materializeInventoryEntries', () => {
  it('places ammo in a quiver and gear in a backpack as separate instances', () => {
    const character = createDefaultCharacter()
    const source = {
      kind: 'class-instance' as const,
      instanceId: 'class-1',
    }

    const { entries } = materializeInventoryEntries(
      [
        { itemId: 'srd-2024:backpack', quantity: 1 },
        { itemId: 'srd-2024:quiver', quantity: 1 },
        { itemId: 'srd-2024:arrows', quantity: 10 },
        { itemId: 'srd-2024:torch', quantity: 5 },
        { itemId: 'srd-2024:greatsword', quantity: 1 },
      ],
      SRD_2024_EQUIPMENT_BY_ID,
      character,
      source,
    )

    const quiver = entries.find((entry) => entry.itemId === 'srd-2024:quiver')
    const backpack = entries.find(
      (entry) => entry.itemId === 'srd-2024:backpack',
    )
    const arrows = entries.find((entry) => entry.itemId === 'srd-2024:arrows')
    const torch = entries.find((entry) => entry.itemId === 'srd-2024:torch')
    const sword = entries.find(
      (entry) => entry.itemId === 'srd-2024:greatsword',
    )

    expect(arrows?.location).toEqual({
      kind: 'container',
      containerInstanceId: quiver?.instanceId,
    })
    expect(torch?.location).toEqual({
      kind: 'container',
      containerInstanceId: backpack?.instanceId,
    })
    expect(sword?.location).toEqual({ kind: 'carried' })
    expect(quiver?.instanceId).not.toEqual(backpack?.instanceId)
  })

  it('rehomes entries across sources so class backpack holds background gear', () => {
    const character = createDefaultCharacter()

    const classEntries = materializeInventoryEntries(
      [
        { itemId: 'srd-2024:backpack', quantity: 1 },
        { itemId: 'srd-2024:greatsword', quantity: 1 },
      ],
      SRD_2024_EQUIPMENT_BY_ID,
      character,
      { kind: 'class-instance', instanceId: 'class-1' },
    ).entries

    const backgroundEntries = materializeInventoryEntries(
      [
        { itemId: 'srd-2024:healers-kit', quantity: 1 },
        { itemId: 'srd-2024:arrows', quantity: 10 },
        { itemId: 'srd-2024:quiver', quantity: 1 },
      ],
      SRD_2024_EQUIPMENT_BY_ID,
      character,
      { kind: 'background', backgroundId: 'srd-2024:soldier' },
      classEntries.length,
    ).entries

    const merged = assignDefaultLocations([
      ...classEntries,
      ...backgroundEntries,
    ])

    const backpack = merged.find((entry) => entry.itemId === 'srd-2024:backpack')
    const quiver = merged.find((entry) => entry.itemId === 'srd-2024:quiver')
    const kit = merged.find((entry) => entry.itemId === 'srd-2024:healers-kit')
    const arrows = merged.find((entry) => entry.itemId === 'srd-2024:arrows')

    expect(kit?.location).toEqual({
      kind: 'container',
      containerInstanceId: backpack?.instanceId,
    })
    expect(arrows?.location).toEqual({
      kind: 'container',
      containerInstanceId: quiver?.instanceId,
    })
  })
})
