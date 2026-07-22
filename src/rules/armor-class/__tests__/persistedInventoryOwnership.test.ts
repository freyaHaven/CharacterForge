import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import {
  EMPTY_CHARACTER_INVENTORY,
  EMPTY_EQUIPMENT_LOADOUT,
} from '../../../domain/equipment/types'
import { reconcileEquipmentLoadout } from '../../../domain/equipment/equipmentLoadout'
import { ownedItemIdsFromInventoryEntries } from '../../../domain/equipment/seedInventory'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { buildPlayResolvedEquipmentView } from '../../../rules/equipment/seedCharacterInventory'
import { calculateCharacterArmorClass } from '../calculateCharacterArmorClass'

describe('persisted inventory ownership for AC / loadout', () => {
  it('uses persisted inventory ownership, not live starting grants', () => {
    const inventory = {
      entries: [
        {
          instanceId: 'owned:chain-mail:0',
          itemId: 'srd-2024:chain-mail',
          quantity: 1,
          location: { kind: 'carried' as const },
        },
      ],
      currency: { goldPieces: 0 },
      seededFromStartingEquipment: true,
      customItems: {},
    }

    const playView = buildPlayResolvedEquipmentView(
      inventory,
      SRD_2024_EQUIPMENT_BY_ID,
      [],
    )

    const armorClass = calculateCharacterArmorClass({
      abilityScores: createDefaultCharacter().abilityScores,
      resolvedEquipment: playView,
      loadout: {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: null,
        offHandItemId: null,
        mainHandGrip: null,
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(armorClass.armorItemId).toBe('srd-2024:chain-mail')
    expect(armorClass.total).toBe(16)
  })

  it('preserves legacy loadout itemIds when owned via persisted inventory', () => {
    const entries = [
      {
        instanceId: 'owned:greatsword:0',
        itemId: 'srd-2024:greatsword',
        quantity: 1,
        location: { kind: 'carried' as const },
      },
      {
        instanceId: 'owned:chain-mail:1',
        itemId: 'srd-2024:chain-mail',
        quantity: 1,
        location: { kind: 'carried' as const },
      },
    ]

    const loadout = reconcileEquipmentLoadout(
      {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: 'srd-2024:greatsword',
        offHandItemId: null,
        mainHandGrip: 'two-handed',
      },
      ownedItemIdsFromInventoryEntries(entries),
      SRD_2024_EQUIPMENT_BY_ID,
      { inferEmptySlots: false },
    )

    expect(loadout).toEqual({
      armorItemId: 'srd-2024:chain-mail',
      mainHandItemId: 'srd-2024:greatsword',
      offHandItemId: null,
      mainHandGrip: null,
    })
  })

  it('prunes loadout slots for itemIds no longer in persisted inventory', () => {
    const loadout = reconcileEquipmentLoadout(
      {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: 'srd-2024:greatsword',
        offHandItemId: null,
        mainHandGrip: 'two-handed',
      },
      ownedItemIdsFromInventoryEntries([]),
      SRD_2024_EQUIPMENT_BY_ID,
      { inferEmptySlots: false },
    )

    expect(loadout).toEqual(EMPTY_EQUIPMENT_LOADOUT)
  })

  it('empty unseeded inventory shape stays valid for defaults', () => {
    expect(createDefaultCharacter().equipment.inventory).toEqual(
      EMPTY_CHARACTER_INVENTORY,
    )
  })
})
