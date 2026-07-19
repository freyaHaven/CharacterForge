import { describe, expect, it } from 'vitest'
import { createBundledBackgroundCatalog } from '../../../adapters/bundledBackgroundCatalog'
import { createBundledClassCatalog } from '../../../adapters/bundledClassCatalog'
import { createBundledEquipmentCatalog } from '../../../adapters/bundledEquipmentCatalog'
import { withSingleClassInstance } from '../../../domain/character/characterClassSelection'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { EMPTY_EQUIPMENT_LOADOUT } from '../../../domain/equipment/types'
import {
  PACKAGE_OPTION_ID,
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
} from '../../../domain/equipment/startingEquipmentHelpers'
import { createTestFighterClassInstance } from '../../../testing/classFixtures'
import {
  pruneInactiveEquipmentSelections,
} from '../../equipment/pruneInactiveEquipmentSelections'
import { equipmentSelectionKey } from '../../../domain/equipment/sourceKey'
import {
  isClassStartingEquipmentResolved,
  resolveCharacterEquipment,
} from '../resolveCharacterEquipment'

const classCatalog = createBundledClassCatalog()
const backgroundCatalog = createBundledBackgroundCatalog()
const equipmentCatalog = createBundledEquipmentCatalog()

describe('resolveCharacterEquipment', () => {
  it('resolves Fighter package A and Soldier package into per-source and merged inventory', async () => {
    const fighter = createTestFighterClassInstance()
    const character = createDefaultCharacter({
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
            optionId: 'package-a',
            choices: [],
          },
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:soldier',
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            optionId: PACKAGE_OPTION_ID,
            choices: [],
          },
        ],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    })

    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )

    expect(resolved.sources).toHaveLength(2)
    expect(resolved.sources[0]).toMatchObject({
      label: 'Fighter',
      sourceKindLabel: 'Class',
      completeness: 'complete',
      isComplete: true,
    })
    expect(resolved.sources[1]).toMatchObject({
      label: 'Soldier',
      sourceKindLabel: 'Background',
      completeness: 'complete',
      isComplete: true,
    })

    expect(resolved.sources[0]?.items.map((item) => item.itemId)).toEqual(
      expect.arrayContaining([
        'srd-2024:chain-mail',
        'srd-2024:greatsword',
        'srd-2024:torch',
      ]),
    )
    expect(
      resolved.sources[0]?.items.find((item) => item.itemId === 'srd-2024:torch')
        ?.quantity,
    ).toBe(10)
    expect(resolved.sources[0]?.currency.goldPieces).toBe(4)

    expect(resolved.sources[1]?.items.map((item) => item.itemId)).toEqual(
      expect.arrayContaining([
        'srd-2024:spear',
        'srd-2024:shortbow',
        'srd-2024:arrows',
        'srd-2024:dice-set',
      ]),
    )
    expect(
      resolved.sources[1]?.items.find((item) => item.itemId === 'srd-2024:arrows')
        ?.quantity,
    ).toBe(20)

    expect(resolved.currency.goldPieces).toBe(18)
    expect(
      resolved.inventory.find((item) => item.itemId === 'srd-2024:torch')
        ?.quantity,
    ).toBe(10)
    expect(isClassStartingEquipmentResolved(resolved, fighter.instanceId)).toBe(
      true,
    )
  })

  it('marks incomplete choices and prunes removed sources only', async () => {
    const fighter = createTestFighterClassInstance()
    const character = createDefaultCharacter({
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
            optionId: 'package-a',
            choices: [],
          },
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:soldier',
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            optionId: PACKAGE_OPTION_ID,
            choices: [],
          },
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:sage',
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            optionId: PACKAGE_OPTION_ID,
            choices: [],
          },
        ],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    })

    const resolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      character,
    )

    const activeKeys = resolved.sources.flatMap((source) =>
      source.entitlements.map((entitlement) =>
        equipmentSelectionKey(source.source, entitlement.entitlement.id),
      ),
    )

    const pruned = pruneInactiveEquipmentSelections(character, activeKeys)
    expect(pruned).toHaveLength(2)
    expect(
      pruned.some(
        (selection) =>
          selection.source.kind === 'background' &&
          selection.source.backgroundId === 'srd-2024:sage',
      ),
    ).toBe(false)

    const incomplete = createDefaultCharacter({
      ...withSingleClassInstance(fighter),
      equipment: { selections: [], loadout: EMPTY_EQUIPMENT_LOADOUT },
    })
    const incompleteResolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      incomplete,
    )
    expect(incompleteResolved.sources[0]?.isComplete).toBe(false)
  })
})
