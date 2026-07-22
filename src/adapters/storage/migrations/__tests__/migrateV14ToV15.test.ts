import { describe, expect, it } from 'vitest'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../domain/equipment/types'
import { migrateV14ToV15 } from '../migrateV14ToV15'

describe('migrateV14ToV15', () => {
  it('normalises missing selection paths to empty arrays', () => {
    expect(
      migrateV14ToV15({
        schemaVersion: 14,
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
                optionId: 'equipment-package',
                choices: [],
              },
              {
                source: { kind: 'background', backgroundId: 'srd-2024:soldier' },
                entitlementId: 'gaming-set',
                path: ['equipment-package'],
                optionId: null,
                choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
              },
            ],
            loadout: EMPTY_EQUIPMENT_LOADOUT,
          },
        },
      }),
    ).toEqual({
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
              optionId: 'equipment-package',
              choices: [],
              path: [],
            },
            {
              source: { kind: 'background', backgroundId: 'srd-2024:soldier' },
              entitlementId: 'gaming-set',
              path: ['equipment-package'],
              optionId: null,
              choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
            },
          ],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      },
    })
  })
})
