import { describe, expect, it } from 'vitest'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../../domain/equipment/types'
import { migrateV13ToV14 } from '../migrateV13ToV14'

describe('migrateV13ToV14', () => {
  it('adds an empty equipment loadout while preserving selections', () => {
    expect(
      migrateV13ToV14({
        schemaVersion: 13,
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
                optionId: 'package',
                choices: [],
              },
            ],
          },
        },
      }),
    ).toEqual({
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
              optionId: 'package',
              choices: [],
            },
          ],
          loadout: EMPTY_EQUIPMENT_LOADOUT,
        },
      },
    })
  })
})
