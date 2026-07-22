import { describe, expect, it } from 'vitest'
import { parseCharacterFile } from '../../../adapters/characterFile/parseCharacterFile'
import { serializeCharacterFile } from '../../../adapters/characterFile/serializeCharacterFile'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { createDefaultCharacter } from '../../character/defaults'
import {
  calculateCarryingLoad,
  calculateInventoryWeight,
} from '../inventoryWeight'
import {
  addCatalogueInventoryItem,
  addCustomInventoryItem,
  areInventoryStacksMergeCompatible,
  mergeInventoryStacks,
  removeInventoryEntry,
} from '../inventoryMutations'
import { enrichPersistedInventoryEntries } from '../seedInventory'
import {
  EMPTY_EQUIPMENT_LOADOUT,
  type CharacterEquipment,
  type InventoryEntry,
} from '../types'

const definitionsById = SRD_2024_EQUIPMENT_BY_ID
const context = { definitionsById }

function entry(
  partial: Partial<InventoryEntry> &
    Pick<InventoryEntry, 'instanceId' | 'itemId'>,
): InventoryEntry {
  return {
    quantity: 1,
    location: { kind: 'carried' },
    ...partial,
  }
}

function equipmentWith(
  entries: InventoryEntry[] = [],
  customItems: CharacterEquipment['inventory']['customItems'] = {},
): CharacterEquipment {
  return {
    selections: [
      {
        source: { kind: 'background', backgroundId: 'srd-2024:soldier' },
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'equipment-package',
        choices: [{ itemId: 'srd-2024:torch', quantity: 1 }],
      },
    ],
    inventory: {
      entries,
      currency: { goldPieces: 10 },
      seededFromStartingEquipment: true,
      customItems,
    },
    loadout: EMPTY_EQUIPMENT_LOADOUT,
  }
}

describe('add inventory items (Slice D)', () => {
  it('adds a catalogue item with unique identity and snapshot', () => {
    const equipment = equipmentWith()
    const result = addCatalogueInventoryItem(
      equipment,
      {
        itemId: 'srd-2024:torch',
        quantity: 3,
        location: { kind: 'carried' },
      },
      {
        ...context,
        createInstanceId: (itemId) => `play:${itemId}:test`,
      },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.equipment.selections).toEqual(equipment.selections)
    expect(result.equipment.inventory.seededFromStartingEquipment).toBe(true)
    expect(result.equipment.inventory.entries).toHaveLength(1)
    expect(result.equipment.inventory.entries[0]).toMatchObject({
      instanceId: 'play:srd-2024:torch:test',
      itemId: 'srd-2024:torch',
      quantity: 3,
      catalogSnapshot: { name: 'Torch', category: 'gear' },
    })
  })

  it('rejects non-positive catalogue quantities and unknown items', () => {
    const equipment = equipmentWith()
    expect(
      addCatalogueInventoryItem(
        equipment,
        { itemId: 'srd-2024:torch', quantity: 0, location: { kind: 'carried' } },
        context,
      ).ok,
    ).toBe(false)
    expect(
      addCatalogueInventoryItem(
        equipment,
        {
          itemId: 'missing:item',
          quantity: 1,
          location: { kind: 'carried' },
        },
        context,
      ),
    ).toEqual({ ok: false, reason: 'unknown-catalogue-item' })
  })

  it('supports carried and container destinations; rejects invalid ones', () => {
    const backpack = entry({
      instanceId: 'backpack:0',
      itemId: 'srd-2024:backpack',
    })
    const equipment = equipmentWith([backpack])

    const intoBag = addCatalogueInventoryItem(
      equipment,
      {
        itemId: 'srd-2024:torch',
        quantity: 1,
        location: { kind: 'container', containerInstanceId: 'backpack:0' },
      },
      context,
    )
    expect(intoBag.ok).toBe(true)

    expect(
      addCatalogueInventoryItem(
        equipment,
        {
          itemId: 'srd-2024:torch',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'missing' },
        },
        context,
      ),
    ).toEqual({ ok: false, reason: 'container-not-found' })

    expect(
      addCatalogueInventoryItem(
        equipment,
        {
          itemId: 'srd-2024:torch',
          quantity: 1,
          location: { kind: 'container', containerInstanceId: 'backpack:0' },
        },
        {
          definitionsById: new Map([
            [
              'srd-2024:torch',
              definitionsById.get('srd-2024:torch')!,
            ],
            // backpack missing from defs → not-a-container
          ]),
        },
      ),
    ).toEqual({ ok: false, reason: 'not-a-container' })
  })

  it('defaults to a new stack and merges only when explicitly requested', () => {
    const existing = entry({
      instanceId: 'torch:0',
      itemId: 'srd-2024:torch',
      quantity: 2,
    })
    const equipment = equipmentWith([existing])

    const alwaysNew = addCatalogueInventoryItem(
      equipment,
      {
        itemId: 'srd-2024:torch',
        quantity: 1,
        location: { kind: 'carried' },
        mergeMode: 'always-new',
      },
      {
        ...context,
        createInstanceId: () => 'torch:1',
      },
    )
    expect(alwaysNew.ok).toBe(true)
    if (alwaysNew.ok) {
      expect(alwaysNew.equipment.inventory.entries).toHaveLength(2)
    }

    const merged = addCatalogueInventoryItem(
      equipment,
      {
        itemId: 'srd-2024:torch',
        quantity: 4,
        location: { kind: 'carried' },
        mergeMode: 'merge-if-compatible',
      },
      context,
    )
    expect(merged.ok).toBe(true)
    if (merged.ok) {
      expect(merged.equipment.inventory.entries).toHaveLength(1)
      expect(merged.equipment.inventory.entries[0]?.quantity).toBe(6)
    }
  })

  it('creates custom items with persisted definitions', () => {
    const equipment = equipmentWith()
    const result = addCustomInventoryItem(
      equipment,
      {
        name: '  Lucky Charm  ',
        quantity: 2,
        location: { kind: 'carried' },
        notes: 'A smooth stone',
        weightLb: 0.1,
        costGp: 1,
        category: 'gear',
      },
      { definitionsById: new Map(), createInstanceId: (id) => `play:${id}:1` },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    const [added] = result.equipment.inventory.entries
    expect(added?.itemId.startsWith('custom:')).toBe(true)
    expect(result.equipment.inventory.customItems[added!.itemId]).toMatchObject({
      name: 'Lucky Charm',
      notes: 'A smooth stone',
      weightLb: 0.1,
      costGp: 1,
      category: 'gear',
    })
    expect(result.equipment.selections).toEqual(equipment.selections)
  })

  it('rejects blank names and invalid weight/cost', () => {
    const equipment = equipmentWith()
    expect(
      addCustomInventoryItem(equipment, {
        name: '   ',
        quantity: 1,
        location: { kind: 'carried' },
      }),
    ).toEqual({ ok: false, reason: 'invalid-name' })
    expect(
      addCustomInventoryItem(equipment, {
        name: 'Bad Weight',
        quantity: 1,
        location: { kind: 'carried' },
        weightLb: -1,
      }),
    ).toEqual({ ok: false, reason: 'invalid-weight' })
    expect(
      addCustomInventoryItem(equipment, {
        name: 'Bad Cost',
        quantity: 1,
        location: { kind: 'carried' },
        costGp: Number.NaN,
      }),
    ).toEqual({ ok: false, reason: 'invalid-cost' })
  })

  it('does not merge customs that only share a display name', () => {
    const first = addCustomInventoryItem(equipmentWith(), {
      name: 'Rope',
      quantity: 1,
      location: { kind: 'carried' },
    })
    expect(first.ok).toBe(true)
    if (!first.ok) {
      return
    }

    const second = addCustomInventoryItem(first.equipment, {
      name: 'Rope',
      quantity: 1,
      location: { kind: 'carried' },
    })
    expect(second.ok).toBe(true)
    if (!second.ok) {
      return
    }

    expect(second.equipment.inventory.entries).toHaveLength(2)
    const [a, b] = second.equipment.inventory.entries
    expect(
      areInventoryStacksMergeCompatible(
        a!,
        b!,
        new Map(),
        second.equipment.inventory.customItems,
      ),
    ).toBe(false)
  })

  it('allows merging stacks of the same custom definition at the same location', () => {
    const created = addCustomInventoryItem(
      equipmentWith(),
      { name: 'Ration Pack', quantity: 2, location: { kind: 'carried' } },
      { definitionsById: new Map(), createInstanceId: () => 'custom-stack:0' },
    )
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    const customId = created.equipment.inventory.entries[0]!.itemId
    const splitSibling: InventoryEntry = {
      instanceId: 'custom-stack:1',
      itemId: customId,
      quantity: 3,
      location: { kind: 'carried' },
    }
    const withSibling: CharacterEquipment = {
      ...created.equipment,
      inventory: {
        ...created.equipment.inventory,
        entries: [...created.equipment.inventory.entries, splitSibling],
      },
    }

    const merged = mergeInventoryStacks(
      withSibling,
      'custom-stack:0',
      'custom-stack:1',
      { definitionsById: new Map() },
    )
    expect(merged.ok).toBe(true)
    if (merged.ok) {
      expect(merged.equipment.inventory.entries).toHaveLength(1)
      expect(merged.equipment.inventory.entries[0]?.quantity).toBe(5)
    }
  })

  it('prunes custom definitions when the last stack is removed', () => {
    const created = addCustomInventoryItem(equipmentWith(), {
      name: 'Temporary',
      quantity: 1,
      location: { kind: 'carried' },
    })
    expect(created.ok).toBe(true)
    if (!created.ok) {
      return
    }

    const instanceId = created.equipment.inventory.entries[0]!.instanceId
    const customId = created.equipment.inventory.entries[0]!.itemId
    const removed = removeInventoryEntry(created.equipment, instanceId, {
      definitionsById: new Map(),
    })
    expect(removed.ok).toBe(true)
    if (removed.ok) {
      expect(removed.equipment.inventory.customItems[customId]).toBeUndefined()
    }
  })

  it('enriches missing catalogue items from snapshot and customs from definitions', () => {
    const customId = 'custom:lucky'
    const entries: InventoryEntry[] = [
      {
        instanceId: 'missing:0',
        itemId: 'pack:gone-item',
        quantity: 1,
        location: { kind: 'carried' },
        catalogSnapshot: { name: 'Vanished Relic', category: 'gear' },
      },
      {
        instanceId: 'custom:0',
        itemId: customId,
        quantity: 2,
        location: { kind: 'carried' },
      },
    ]
    const enriched = enrichPersistedInventoryEntries(
      entries,
      new Map(),
      {
        [customId]: {
          id: customId,
          name: 'Lucky Charm',
          weightLb: 0.5,
        },
      },
    )

    expect(enriched[0]).toMatchObject({
      name: 'Vanished Relic',
      weightLb: null,
    })
    expect(enriched[1]).toMatchObject({
      name: 'Lucky Charm',
      weightLb: 0.5,
    })

    const weight = calculateInventoryWeight(entries, new Map())
    // Without custom defs in the catalogue map, custom weight is unknown unless
    // we merge customs into the map — calculate via enriched path in UI.
    expect(weight.unknownEntryCount).toBe(2)

    const withCustomDefs = calculateInventoryWeight(
      entries,
      new Map([
        [
          customId,
          {
            id: customId,
            editionId: 'srd-2024' as const,
            name: 'Lucky Charm',
            category: 'gear' as const,
            source: {
              id: 'character-custom',
              name: 'Custom item',
              version: '1',
              licence: 'proprietary',
              attribution: 'test',
              documentUrl: '',
            },
            weightLb: 0.5,
          },
        ],
      ]),
    )
    expect(withCustomDefs.knownTotalLb).toBe(1)
    expect(withCustomDefs.unknownEntryCount).toBe(1)
    expect(
      calculateCarryingLoad(withCustomDefs, 10).incompleteTotal,
    ).toBe(true)
  })

  it('round-trips catalogue and custom items through .cforge export/import', () => {
    const character = createDefaultCharacter({
      name: 'Looter',
      equipment: {
        selections: [],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
        inventory: {
          entries: [],
          currency: { goldPieces: 0 },
          seededFromStartingEquipment: true,
          customItems: {},
        },
      },
    })

    const withCatalogue = addCatalogueInventoryItem(
      character.equipment,
      {
        itemId: 'srd-2024:dagger',
        quantity: 1,
        location: { kind: 'carried' },
      },
      context,
    )
    expect(withCatalogue.ok).toBe(true)
    if (!withCatalogue.ok) {
      return
    }

    const withCustom = addCustomInventoryItem(withCatalogue.equipment, {
      name: 'Heirloom Brooch',
      quantity: 1,
      location: { kind: 'carried' },
      weightLb: 0.2,
    })
    expect(withCustom.ok).toBe(true)
    if (!withCustom.ok) {
      return
    }

    const exported = {
      ...character,
      equipment: withCustom.equipment,
    }
    const imported = parseCharacterFile(serializeCharacterFile(exported))
    expect(imported.ok).toBe(true)
    if (!imported.ok) {
      return
    }

    expect(imported.character.equipment.inventory.entries).toHaveLength(2)
    expect(
      Object.keys(imported.character.equipment.inventory.customItems),
    ).toHaveLength(1)
    expect(
      imported.character.equipment.inventory.entries.some(
        (row) => row.catalogSnapshot?.name === 'Dagger',
      ),
    ).toBe(true)
  })
})
