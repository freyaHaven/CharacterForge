import { describe, expect, it } from 'vitest'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../domain/equipment/types'
import { migrateV16ToV17 } from '../migrateV16ToV17'

describe('migrateV16ToV17', () => {
  it('adds an empty customItems map without touching entries or seed flag', () => {
    const migrated = migrateV16ToV17({
      schemaVersion: 16,
      character: {
        id: 'char-1',
        name: 'Aldric',
        editionId: 'srd-2024',
        creationMethod: 'manual',
        abilityScores: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        },
        equipment: {
          selections: [
            {
              source: { kind: 'background', backgroundId: 'srd-2024:soldier' },
              entitlementId: 'starting-equipment',
              path: [],
              optionId: 'equipment-package',
              choices: [],
            },
          ],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
          inventory: {
            entries: [
              {
                instanceId: 'torch:0',
                itemId: 'srd-2024:torch',
                quantity: 2,
                location: { kind: 'carried' },
              },
            ],
            currency: { goldPieces: 5 },
            seededFromStartingEquipment: true,
          },
        },
      },
    })

    expect(migrated.schemaVersion).toBe(17)
    expect(migrated.character.equipment.inventory.customItems).toEqual({})
    expect(migrated.character.equipment.inventory.entries).toEqual([
      {
        instanceId: 'torch:0',
        itemId: 'srd-2024:torch',
        quantity: 2,
        location: { kind: 'carried' },
      },
    ])
    expect(
      migrated.character.equipment.inventory.seededFromStartingEquipment,
    ).toBe(true)
    expect(migrated.character.equipment.selections).toHaveLength(1)
  })
})
