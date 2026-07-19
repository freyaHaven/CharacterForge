import { describe, expect, it } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { EMPTY_EQUIPMENT_LOADOUT } from '../types'
import {
  formatOffHandSlotLabel,
  inferDefaultEquipmentLoadout,
  previewEquipItem,
  pruneEquipmentLoadout,
} from '../equipmentLoadout'

describe('equipmentLoadout', () => {
  it('equipping a two-handed weapon clears the off-hand shield with a confirmation message', () => {
    const preview = previewEquipItem(
      {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: 'srd-2024:longsword',
        offHandItemId: 'srd-2024:shield',
        mainHandGrip: 'one-handed',
      },
      'srd-2024:greatsword',
      SRD_2024_EQUIPMENT_BY_ID,
    )

    expect(preview.hasConflict).toBe(true)
    expect(preview.message).toMatch(/requires both hands/i)
    expect(preview.nextLoadout).toEqual({
      armorItemId: 'srd-2024:chain-mail',
      mainHandItemId: 'srd-2024:greatsword',
      offHandItemId: null,
      mainHandGrip: null,
    })
    expect(preview.unequipped.map((entry) => entry.itemId)).toEqual([
      'srd-2024:longsword',
      'srd-2024:shield',
    ])
  })

  it('allows a one-handed weapon with a shield', () => {
    const withSword = previewEquipItem(
      EMPTY_EQUIPMENT_LOADOUT,
      'srd-2024:longsword',
      SRD_2024_EQUIPMENT_BY_ID,
      { preferredVersatileGrip: 'one-handed' },
    )
    const withShield = previewEquipItem(
      withSword.nextLoadout,
      'srd-2024:shield',
      SRD_2024_EQUIPMENT_BY_ID,
    )

    expect(withShield.nextLoadout.offHandItemId).toBe('srd-2024:shield')
    expect(withShield.nextLoadout.mainHandItemId).toBe('srd-2024:longsword')
  })

  it('prunes loadout items that are no longer owned', () => {
    const pruned = pruneEquipmentLoadout(
      {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: 'srd-2024:greatsword',
        offHandItemId: 'srd-2024:shield',
        mainHandGrip: null,
      },
      new Set(['srd-2024:greatsword']),
      SRD_2024_EQUIPMENT_BY_ID,
    )

    expect(pruned).toEqual({
      armorItemId: null,
      mainHandItemId: 'srd-2024:greatsword',
      offHandItemId: null,
      mainHandGrip: null,
    })
  })

  it('infers armour, a two-handed weapon, and skips shield when hands are full', () => {
    const inferred = inferDefaultEquipmentLoadout(
      new Set([
        'srd-2024:chain-mail',
        'srd-2024:greatsword',
        'srd-2024:shield',
      ]),
      SRD_2024_EQUIPMENT_BY_ID,
    )

    expect(inferred.armorItemId).toBe('srd-2024:chain-mail')
    expect(inferred.mainHandItemId).toBe('srd-2024:greatsword')
    expect(inferred.offHandItemId).toBeNull()
    expect(formatOffHandSlotLabel(inferred, SRD_2024_EQUIPMENT_BY_ID)).toMatch(
      /Occupied by Greatsword/i,
    )
  })

  it('infers a shield when the main hand is one-handed', () => {
    const inferred = inferDefaultEquipmentLoadout(
      new Set(['srd-2024:leather-armor', 'srd-2024:mace', 'srd-2024:shield']),
      SRD_2024_EQUIPMENT_BY_ID,
    )

    expect(inferred.armorItemId).toBe('srd-2024:leather-armor')
    expect(inferred.mainHandItemId).toBe('srd-2024:mace')
    expect(inferred.offHandItemId).toBe('srd-2024:shield')
  })
})
