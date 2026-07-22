import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledEquipmentCatalog } from '../../../adapters/bundledEquipmentCatalog'
import { parseCharacterFile } from '../../../adapters/characterFile/parseCharacterFile'
import { serializeCharacterFile } from '../../../adapters/characterFile/serializeCharacterFile'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { withSingleClassInstance } from '../../character/characterClassSelection'
import { createDefaultCharacter } from '../../character/defaults'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../startingEquipmentHelpers'
import {
  EMPTY_CHARACTER_INVENTORY,
  EMPTY_EQUIPMENT_LOADOUT,
  type CharacterEquipment,
  type InventoryEntry,
} from '../types'
import { seedInventoryFromResolvedEntries } from '../seedInventory'
import {
  ZERO_QUANTITY_POLICY,
  adjustInventoryCurrency,
  adjustInventoryEntryQuantity,
  areInventoryStacksMergeCompatible,
  mergeInventoryStacks,
  moveInventoryEntry,
  removeInventoryEntry,
  setInventoryCurrency,
  setInventoryEntryQuantity,
  splitInventoryStack,
} from '../inventoryMutations'
import { resolveCharacterEquipment } from '../../../rules/character/resolveCharacterEquipment'
import { trySeedInventoryFromResolvedEquipment } from '../../../rules/equipment/seedCharacterInventory'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'

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
  entries: InventoryEntry[],
  overrides: Partial<CharacterEquipment> = {},
): CharacterEquipment {
  return {
    selections: [
      {
        source: { kind: 'background', backgroundId: 'srd-2024:soldier' },
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'equipment-package',
        choices: [],
      },
    ],
    inventory: {
      entries,
      currency: { goldPieces: 10 },
      seededFromStartingEquipment: true,
      customItems: {},
    },
    loadout: EMPTY_EQUIPMENT_LOADOUT,
    ...overrides,
  }
}

describe('inventoryMutations', () => {
  it('documents zero-quantity policy as removal', () => {
    expect(ZERO_QUANTITY_POLICY).toBe('remove')
  })

  it('increases and decreases quantity without rewriting selections or seed flag', () => {
    const equipment = equipmentWith([
      entry({ instanceId: 'arrows:0', itemId: 'srd-2024:arrows', quantity: 10 }),
    ])
    const selectionsRef = equipment.selections

    const increased = adjustInventoryEntryQuantity(
      equipment,
      'arrows:0',
      5,
      context,
    )
    expect(increased.ok).toBe(true)
    if (!increased.ok) {
      return
    }
    expect(increased.equipment.inventory.entries[0]?.quantity).toBe(15)
    expect(increased.equipment.selections).toBe(selectionsRef)
    expect(increased.equipment.inventory.seededFromStartingEquipment).toBe(true)

    const decreased = adjustInventoryEntryQuantity(
      increased.equipment,
      'arrows:0',
      -3,
      context,
    )
    expect(decreased.ok).toBe(true)
    if (!decreased.ok) {
      return
    }
    expect(decreased.equipment.inventory.entries[0]?.quantity).toBe(12)
    expect(decreased.equipment.selections).toBe(selectionsRef)
  })

  it('rejects invalid quantities and treats zero as removal', () => {
    const equipment = equipmentWith([
      entry({ instanceId: 'torch:0', itemId: 'srd-2024:torch', quantity: 4 }),
    ])

    expect(
      setInventoryEntryQuantity(equipment, 'torch:0', 1.5, context).ok,
    ).toBe(false)
    expect(
      setInventoryEntryQuantity(equipment, 'torch:0', -1, context),
    ).toEqual({ ok: false, reason: 'invalid-quantity' })
    expect(
      adjustInventoryEntryQuantity(equipment, 'torch:0', 0, context),
    ).toEqual({ ok: false, reason: 'invalid-quantity' })
    expect(
      adjustInventoryEntryQuantity(equipment, 'torch:0', -10, context),
    ).toEqual({ ok: false, reason: 'insufficient-quantity' })

    const removed = setInventoryEntryQuantity(equipment, 'torch:0', 0, context)
    expect(removed.ok).toBe(true)
    if (removed.ok) {
      expect(removed.equipment.inventory.entries).toEqual([])
    }
  })

  it('removes entries and does not mutate the input equipment object', () => {
    const equipment = equipmentWith([
      entry({ instanceId: 'torch:0', itemId: 'srd-2024:torch', quantity: 2 }),
    ])
    const snapshot = structuredClone(equipment)

    const result = removeInventoryEntry(equipment, 'torch:0', context)
    expect(result.ok).toBe(true)
    expect(equipment).toEqual(snapshot)
    if (result.ok) {
      expect(result.equipment.inventory.entries).toEqual([])
    }
  })

  it('splits a stack with a new unique identity and preserves the source id', () => {
    const equipment = equipmentWith([
      entry({ instanceId: 'arrows:0', itemId: 'srd-2024:arrows', quantity: 20 }),
    ])

    const result = splitInventoryStack(equipment, 'arrows:0', 7, {
      ...context,
      createInstanceId: () => 'arrows:split-1',
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.equipment.inventory.entries).toEqual([
      entry({ instanceId: 'arrows:0', itemId: 'srd-2024:arrows', quantity: 13 }),
      entry({
        instanceId: 'arrows:split-1',
        itemId: 'srd-2024:arrows',
        quantity: 7,
      }),
    ])
  })

  it('rejects splits that consume the whole stack or more', () => {
    const equipment = equipmentWith([
      entry({ instanceId: 'arrows:0', itemId: 'srd-2024:arrows', quantity: 5 }),
    ])

    expect(splitInventoryStack(equipment, 'arrows:0', 5, context)).toEqual({
      ok: false,
      reason: 'insufficient-quantity',
    })
  })

  it('merges compatible stacks and preserves the target identity', () => {
    const backpack = entry({
      instanceId: 'backpack:0',
      itemId: 'srd-2024:backpack',
    })
    const left = entry({
      instanceId: 'arrows:0',
      itemId: 'srd-2024:arrows',
      quantity: 10,
      location: {
        kind: 'container',
        containerInstanceId: 'backpack:0',
      },
    })
    const right = entry({
      instanceId: 'arrows:1',
      itemId: 'srd-2024:arrows',
      quantity: 5,
      location: {
        kind: 'container',
        containerInstanceId: 'backpack:0',
      },
    })
    const equipment = equipmentWith([backpack, left, right])

    expect(
      areInventoryStacksMergeCompatible(left, right, definitionsById),
    ).toBe(true)

    const result = mergeInventoryStacks(
      equipment,
      'arrows:0',
      'arrows:1',
      context,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(result.equipment.inventory.entries).toEqual([
      backpack,
      entry({
        instanceId: 'arrows:0',
        itemId: 'srd-2024:arrows',
        quantity: 15,
        location: {
          kind: 'container',
          containerInstanceId: 'backpack:0',
        },
      }),
    ])
  })

  it('rejects incompatible merges (different item, location, or containers)', () => {
    const backpack = entry({
      instanceId: 'backpack:0',
      itemId: 'srd-2024:backpack',
    })
    const pouch = entry({
      instanceId: 'pouch:0',
      itemId: 'srd-2024:pouch',
    })
    const arrowsInBag = entry({
      instanceId: 'arrows:0',
      itemId: 'srd-2024:arrows',
      quantity: 5,
      location: {
        kind: 'container',
        containerInstanceId: 'backpack:0',
      },
    })
    const arrowsCarried = entry({
      instanceId: 'arrows:1',
      itemId: 'srd-2024:arrows',
      quantity: 5,
      location: { kind: 'carried' },
    })
    const torches = entry({
      instanceId: 'torch:0',
      itemId: 'srd-2024:torch',
      quantity: 5,
      location: { kind: 'carried' },
    })

    const equipment = equipmentWith([
      backpack,
      pouch,
      arrowsInBag,
      arrowsCarried,
      torches,
    ])

    expect(
      mergeInventoryStacks(equipment, 'arrows:0', 'arrows:1', context),
    ).toEqual({ ok: false, reason: 'incompatible-merge' })
    expect(
      mergeInventoryStacks(equipment, 'arrows:1', 'torch:0', context),
    ).toEqual({ ok: false, reason: 'incompatible-merge' })
    expect(
      mergeInventoryStacks(equipment, 'backpack:0', 'pouch:0', context),
    ).toEqual({ ok: false, reason: 'incompatible-merge' })
  })

  it('moves entries into and out of containers with cycle protections', () => {
    const backpack = entry({
      instanceId: 'backpack:0',
      itemId: 'srd-2024:backpack',
    })
    const pouch = entry({
      instanceId: 'pouch:0',
      itemId: 'srd-2024:pouch',
      location: {
        kind: 'container',
        containerInstanceId: 'backpack:0',
      },
    })
    const torch = entry({
      instanceId: 'torch:0',
      itemId: 'srd-2024:torch',
      quantity: 3,
    })
    const sword = entry({
      instanceId: 'sword:0',
      itemId: 'srd-2024:greatsword',
    })
    const equipment = equipmentWith([backpack, pouch, torch, sword])

    const intoBag = moveInventoryEntry(
      equipment,
      'torch:0',
      { kind: 'container', containerInstanceId: 'backpack:0' },
      context,
    )
    expect(intoBag.ok).toBe(true)
    if (intoBag.ok) {
      expect(
        intoBag.equipment.inventory.entries.find((e) => e.instanceId === 'torch:0')
          ?.location,
      ).toEqual({
        kind: 'container',
        containerInstanceId: 'backpack:0',
      })
    }

    const out = moveInventoryEntry(
      intoBag.ok ? intoBag.equipment : equipment,
      'torch:0',
      { kind: 'carried' },
      context,
    )
    expect(out.ok).toBe(true)
    if (out.ok) {
      expect(
        out.equipment.inventory.entries.find((e) => e.instanceId === 'torch:0')
          ?.location,
      ).toEqual({ kind: 'carried' })
    }

    expect(
      moveInventoryEntry(
        equipment,
        'backpack:0',
        { kind: 'container', containerInstanceId: 'backpack:0' },
        context,
      ),
    ).toEqual({ ok: false, reason: 'self-containment' })

    expect(
      moveInventoryEntry(
        equipment,
        'torch:0',
        { kind: 'container', containerInstanceId: 'missing' },
        context,
      ),
    ).toEqual({ ok: false, reason: 'container-not-found' })

    expect(
      moveInventoryEntry(
        equipment,
        'torch:0',
        { kind: 'container', containerInstanceId: 'sword:0' },
        context,
      ),
    ).toEqual({ ok: false, reason: 'not-a-container' })

    expect(
      moveInventoryEntry(
        equipment,
        'backpack:0',
        { kind: 'container', containerInstanceId: 'pouch:0' },
        context,
      ),
    ).toEqual({ ok: false, reason: 'container-cycle' })
  })

  it('adjusts currency and rejects negatives', () => {
    const equipment = equipmentWith([])

    const gained = adjustInventoryCurrency(equipment, 5, context)
    expect(gained.ok).toBe(true)
    if (gained.ok) {
      expect(gained.equipment.inventory.currency.goldPieces).toBe(15)
      expect(gained.equipment.inventory.seededFromStartingEquipment).toBe(true)
      expect(gained.equipment.selections).toBe(equipment.selections)
    }

    expect(adjustInventoryCurrency(equipment, -50, context)).toEqual({
      ok: false,
      reason: 'negative-currency',
    })
    expect(setInventoryCurrency(equipment, -1, context)).toEqual({
      ok: false,
      reason: 'negative-currency',
    })
    expect(setInventoryCurrency(equipment, Number.NaN, context)).toEqual({
      ok: false,
      reason: 'invalid-currency',
    })
  })

  it('prunes loadout when an equipped item is removed or fully spent', () => {
    const equipment = equipmentWith(
      [
        entry({
          instanceId: 'mail:0',
          itemId: 'srd-2024:chain-mail',
        }),
        entry({
          instanceId: 'sword:0',
          itemId: 'srd-2024:greatsword',
        }),
      ],
      {
        loadout: {
          armorItemId: 'srd-2024:chain-mail',
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: null,
        },
      },
    )

    const removed = removeInventoryEntry(equipment, 'mail:0', context)
    expect(removed.ok).toBe(true)
    if (removed.ok) {
      expect(removed.equipment.loadout.armorItemId).toBeNull()
      expect(removed.equipment.loadout.mainHandItemId).toBe(
        'srd-2024:greatsword',
      )
    }

    const spent = setInventoryEntryQuantity(
      removed.ok ? removed.equipment : equipment,
      'sword:0',
      0,
      context,
    )
    expect(spent.ok).toBe(true)
    if (spent.ok) {
      expect(spent.equipment.loadout).toEqual(EMPTY_EQUIPMENT_LOADOUT)
    }
  })

  it('keeps loadout when merging stacks that share the equipped itemId', () => {
    const equipment = equipmentWith(
      [
        entry({
          instanceId: 'sword:0',
          itemId: 'srd-2024:greatsword',
        }),
        entry({
          instanceId: 'sword:1',
          itemId: 'srd-2024:greatsword',
        }),
      ],
      {
        loadout: {
          armorItemId: null,
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: null,
        },
      },
    )

    // Greatswords are not containers; same location → mergeable.
    const result = mergeInventoryStacks(
      equipment,
      'sword:0',
      'sword:1',
      context,
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.equipment.loadout.mainHandItemId).toBe(
        'srd-2024:greatsword',
      )
      expect(result.equipment.inventory.entries).toHaveLength(1)
      expect(result.equipment.inventory.entries[0]?.instanceId).toBe('sword:0')
    }
  })

  it('keeps loadout when moving an equipped item into a container', () => {
    const equipment = equipmentWith(
      [
        entry({
          instanceId: 'backpack:0',
          itemId: 'srd-2024:backpack',
        }),
        entry({
          instanceId: 'sword:0',
          itemId: 'srd-2024:greatsword',
        }),
      ],
      {
        loadout: {
          armorItemId: null,
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: null,
        },
      },
    )

    const result = moveInventoryEntry(
      equipment,
      'sword:0',
      { kind: 'container', containerInstanceId: 'backpack:0' },
      context,
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.equipment.loadout.mainHandItemId).toBe(
        'srd-2024:greatsword',
      )
    }
  })

  it('ejects contents to carried when removing a container', () => {
    const equipment = equipmentWith(
      [
        entry({
          instanceId: 'backpack:0',
          itemId: 'srd-2024:backpack',
        }),
        entry({
          instanceId: 'torch:0',
          itemId: 'srd-2024:torch',
          quantity: 3,
          location: {
            kind: 'container',
            containerInstanceId: 'backpack:0',
          },
        }),
        entry({
          instanceId: 'sword:0',
          itemId: 'srd-2024:greatsword',
          location: {
            kind: 'container',
            containerInstanceId: 'backpack:0',
          },
        }),
      ],
      {
        loadout: {
          armorItemId: null,
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: null,
        },
      },
    )

    const result = removeInventoryEntry(equipment, 'backpack:0', context)
    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }

    expect(
      result.equipment.inventory.entries.map((e) => e.instanceId).sort(),
    ).toEqual(['sword:0', 'torch:0'])
    expect(
      result.equipment.inventory.entries.every(
        (e) => e.location.kind === 'carried',
      ),
    ).toBe(true)
    expect(result.equipment.loadout.mainHandItemId).toBe('srd-2024:greatsword')
  })

  it('round-trips mutations through .cforge export/import', () => {
    const character = createDefaultCharacter({
      name: 'Mutation Export',
      equipment: equipmentWith([
        entry({
          instanceId: 'arrows:0',
          itemId: 'srd-2024:arrows',
          quantity: 20,
        }),
      ]),
    })

    const mutated = adjustInventoryEntryQuantity(
      character.equipment,
      'arrows:0',
      -5,
      context,
    )
    expect(mutated.ok).toBe(true)
    if (!mutated.ok) {
      return
    }

    const withCurrency = adjustInventoryCurrency(mutated.equipment, 12, context)
    expect(withCurrency.ok).toBe(true)
    if (!withCurrency.ok) {
      return
    }

    const exported = {
      ...character,
      equipment: withCurrency.equipment,
    }
    const imported = parseCharacterFile(serializeCharacterFile(exported))
    expect(imported).toEqual({ ok: true, character: exported })
  })

  it('keeps mutations after resolver refresh and selection changes', async () => {
    const classCatalog = createBundledClassCatalog()
    const backgroundCatalog = createBundledBackgroundCatalog()
    const equipmentCatalog = createBundledEquipmentCatalog()
    const fighter = createTestFighterClassInstance()

    const character = createDefaultCharacter({
      name: 'Survive Refresh',
      ...withSingleClassInstance(fighter),
      background: {
        backgroundId: 'srd-2024:soldier',
        abilityScoreIncrease: {
          mode: 'two-and-one',
          plusTwo: 'strength',
          plusOne: 'constitution',
        },
        choices: { 'gaming-set': 'dice-set' },
      },
      equipment: {
        selections: [
          {
            source: {
              kind: 'class-instance',
              instanceId: fighter.instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:soldier',
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: PACKAGE_OPTION_ID,
            choices: [],
          },
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:soldier',
            },
            entitlementId: 'gaming-set',
            path: [PACKAGE_OPTION_ID],
            optionId: null,
            choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
          },
        ],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
        inventory: EMPTY_CHARACTER_INVENTORY,
      },
    })

    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )
    const seeded = seedInventoryFromResolvedEntries(
      resolved.entries,
      resolved.currency.goldPieces,
    )
    const torch = seeded.entries.find((e) => e.itemId === 'srd-2024:torch')
    expect(torch).toBeDefined()

    let equipment: CharacterEquipment = {
      ...character.equipment,
      inventory: seeded,
    }

    const qty = adjustInventoryEntryQuantity(
      equipment,
      torch!.instanceId,
      3,
      context,
    )
    expect(qty.ok).toBe(true)
    if (!qty.ok) {
      return
    }
    equipment = qty.equipment

    const currency = adjustInventoryCurrency(equipment, 25, context)
    expect(currency.ok).toBe(true)
    if (!currency.ok) {
      return
    }
    equipment = currency.equipment

    const mutatedSnapshot = structuredClone(equipment.inventory)

    const afterSelectionChange = {
      ...character,
      equipment: {
        ...equipment,
        selections: equipment.selections.map((selection) =>
          selection.source.kind === 'class-instance'
            ? { ...selection, optionId: 'gold-alternative' }
            : selection,
        ),
      },
    }

    const resolvedAgain = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      afterSelectionChange,
    )

    expect(
      trySeedInventoryFromResolvedEquipment(
        afterSelectionChange.equipment.inventory,
        resolvedAgain,
      ),
    ).toBeNull()
    expect(afterSelectionChange.equipment.inventory).toEqual(mutatedSnapshot)
  })
})
