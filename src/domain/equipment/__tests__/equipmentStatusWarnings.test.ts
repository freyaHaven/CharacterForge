import { describe, expect, it } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { EMPTY_EQUIPMENT_LOADOUT } from '../types'
import { deriveEquipmentStatusWarnings } from '../equipmentStatusWarnings'

describe('deriveEquipmentStatusWarnings', () => {
  it('warns about armour only when owned armour is unequipped', () => {
    expect(
      deriveEquipmentStatusWarnings(
        ['srd-2024:chain-mail', 'srd-2024:greatsword'],
        EMPTY_EQUIPMENT_LOADOUT,
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([
      {
        id: 'no-armour',
        title: 'No armour equipped',
        detail:
          'You own Chain Mail, but none is currently equipped.',
      },
      {
        id: 'no-weapon',
        title: 'No weapon equipped',
        detail:
          'You own a Greatsword, but none is currently equipped.',
      },
    ])

    expect(
      deriveEquipmentStatusWarnings(
        ['srd-2024:chain-mail'],
        {
          ...EMPTY_EQUIPMENT_LOADOUT,
          armorItemId: 'srd-2024:chain-mail',
        },
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([])
  })

  it('warns about weapons only when no hand holds a weapon', () => {
    const owned = [
      'srd-2024:greatsword',
      'srd-2024:longbow',
      'srd-2024:shield',
    ]

    expect(
      deriveEquipmentStatusWarnings(
        owned,
        EMPTY_EQUIPMENT_LOADOUT,
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([
      {
        id: 'no-weapon',
        title: 'No weapon equipped',
        detail:
          'You own a Greatsword and a Longbow, but neither is equipped.',
      },
    ])

    expect(
      deriveEquipmentStatusWarnings(
        owned,
        {
          ...EMPTY_EQUIPMENT_LOADOUT,
          mainHandItemId: 'srd-2024:greatsword',
        },
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([])

    expect(
      deriveEquipmentStatusWarnings(
        owned,
        {
          ...EMPTY_EQUIPMENT_LOADOUT,
          offHandItemId: 'srd-2024:shield',
        },
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([
      {
        id: 'no-weapon',
        title: 'No weapon equipped',
        detail:
          'You own a Greatsword and a Longbow, but neither is equipped.',
      },
    ])
  })

  it('does not warn when the character owns no relevant equipment', () => {
    expect(
      deriveEquipmentStatusWarnings(
        ['srd-2024:backpack', 'srd-2024:arrows', 'srd-2024:shield'],
        EMPTY_EQUIPMENT_LOADOUT,
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([])
  })

  it('does not warn merely because some owned gear is unequipped', () => {
    expect(
      deriveEquipmentStatusWarnings(
        [
          'srd-2024:chain-mail',
          'srd-2024:studded-leather-armor',
          'srd-2024:greatsword',
          'srd-2024:longbow',
        ],
        {
          armorItemId: 'srd-2024:chain-mail',
          mainHandItemId: 'srd-2024:greatsword',
          offHandItemId: null,
          mainHandGrip: null,
        },
        SRD_2024_EQUIPMENT_BY_ID,
      ),
    ).toEqual([])
  })
})
