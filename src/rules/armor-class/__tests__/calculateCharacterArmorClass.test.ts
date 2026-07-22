import { describe, expect, it } from 'vitest'
import { SRD_2024_EQUIPMENT_BY_ID } from '../../../content/packs/srd-2024/equipment'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import type { AbilityScores } from '../../../domain/types'
import type { ResolvedEquipment } from '../../character/resolveCharacterEquipment'
import { calculateCharacterArmorClass } from '../calculateCharacterArmorClass'

const BASE_SCORES: AbilityScores = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

function inventory(...itemIds: string[]): ResolvedEquipment {
  const lines = itemIds.map((itemId) => {
    const definition = SRD_2024_EQUIPMENT_BY_ID.get(itemId)
    return {
      itemId,
      name: definition?.name ?? itemId,
      quantity: 1,
      category: definition?.category ?? ('gear' as const),
    }
  })

  return {
    sources: [],
    entries: [],
    currency: { goldPieces: 0 },
    inventory: lines,
    mergedInventory: lines,
    weightCarriedLb: 0,
  }
}

describe('calculateCharacterArmorClass', () => {
  it('uses unarmoured AC when no armour is equipped in the loadout', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 16 },
      resolvedEquipment: inventory('srd-2024:chain-mail', 'srd-2024:shield'),
      loadout: EMPTY_EQUIPMENT_LOADOUT,
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(result).toEqual({
      total: 13,
      base: 10,
      dexterityBonus: 3,
      shieldBonus: 0,
      otherBonus: 0,
      armorItemId: null,
      shieldItemId: null,
    })
  })

  it('does not grant shield AC while wielding a two-handed weapon', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 14 },
      resolvedEquipment: inventory(
        'srd-2024:chain-mail',
        'srd-2024:greatsword',
        'srd-2024:shield',
      ),
      loadout: {
        armorItemId: 'srd-2024:chain-mail',
        mainHandItemId: 'srd-2024:greatsword',
        offHandItemId: null,
        mainHandGrip: null,
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(result.total).toBe(16)
    expect(result.shieldBonus).toBe(0)
    expect(result.shieldItemId).toBeNull()
  })

  it('applies light armour and an equipped shield from the loadout', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 16 },
      resolvedEquipment: inventory(
        'srd-2024:leather-armor',
        'srd-2024:shield',
      ),
      loadout: {
        armorItemId: 'srd-2024:leather-armor',
        mainHandItemId: 'srd-2024:longsword',
        offHandItemId: 'srd-2024:shield',
        mainHandGrip: 'one-handed',
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(result.total).toBe(16) // 11 + 3 + 2
    expect(result.armorItemId).toBe('srd-2024:leather-armor')
    expect(result.shieldItemId).toBe('srd-2024:shield')
  })

  it('caps Dexterity for medium armour', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 18 },
      resolvedEquipment: inventory('srd-2024:chain-shirt'),
      loadout: {
        ...EMPTY_EQUIPMENT_LOADOUT,
        armorItemId: 'srd-2024:chain-shirt',
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(result.total).toBe(15)
    expect(result.dexterityBonus).toBe(2)
  })

  it('ignores Dexterity for heavy armour', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 18 },
      resolvedEquipment: inventory('srd-2024:chain-mail'),
      loadout: {
        ...EMPTY_EQUIPMENT_LOADOUT,
        armorItemId: 'srd-2024:chain-mail',
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
    })

    expect(result.total).toBe(16)
    expect(result.dexterityBonus).toBe(0)
  })

  it('adds otherBonus (e.g. Defense Fighting Style) to the total', () => {
    const result = calculateCharacterArmorClass({
      abilityScores: { ...BASE_SCORES, dexterity: 14 },
      resolvedEquipment: inventory('srd-2024:chain-mail'),
      loadout: {
        ...EMPTY_EQUIPMENT_LOADOUT,
        armorItemId: 'srd-2024:chain-mail',
      },
      equipmentDefinitionsById: SRD_2024_EQUIPMENT_BY_ID,
      otherBonus: 1,
    })

    expect(result.total).toBe(17)
    expect(result.otherBonus).toBe(1)
  })
})
