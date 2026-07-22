import { describe, expect, it } from 'vitest'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../domain/equipment/types'
import { migrateV15ToV16 } from '../migrateV15ToV16'

describe('migrateV15ToV16', () => {
  it('adds an empty unseeded inventory and preserves selections and loadout', () => {
    expect(
      migrateV15ToV16({
        schemaVersion: 15,
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
            loadout: {
              armorItemId: 'srd-2024:chain-mail',
              mainHandItemId: 'srd-2024:longsword',
              offHandItemId: null,
              mainHandGrip: null,
            },
          },
        },
      }),
    ).toEqual({
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
          loadout: {
            armorItemId: 'srd-2024:chain-mail',
            mainHandItemId: 'srd-2024:longsword',
            offHandItemId: null,
            mainHandGrip: null,
          },
          inventory: {
            entries: [],
            currency: { goldPieces: 0 },
            seededFromStartingEquipment: false,
          },
        },
      },
    })
  })

  it('does not invent inventory entries during migration', () => {
    const migrated = migrateV15ToV16({
      schemaVersion: 15,
      character: {
        id: 'char-2',
        name: 'Brynn',
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
          selections: [],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      },
    })

    expect(migrated.character.equipment.inventory.entries).toEqual([])
    expect(migrated.character.equipment.inventory.seededFromStartingEquipment).toBe(
      false,
    )
  })
})
