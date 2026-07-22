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

function soldierPackageSelections(backgroundId = 'srd-2024:soldier') {
  return [
    {
      source: {
        kind: 'background' as const,
        backgroundId,
      },
      entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
      path: [],
      optionId: PACKAGE_OPTION_ID,
      choices: [],
    },
    {
      source: {
        kind: 'background' as const,
        backgroundId,
      },
      entitlementId: 'gaming-set',
      path: [PACKAGE_OPTION_ID],
      optionId: null,
      choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
    },
  ]
}

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
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          ...soldierPackageSelections(),
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
    expect(
      resolved.sources[1]?.entitlements.map((entry) => entry.entitlement.id),
    ).toEqual(['starting-equipment', 'gaming-set'])
    expect(resolved.sources[1]?.entitlements[1]?.path).toEqual([
      PACKAGE_OPTION_ID,
    ])

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
    expect(resolved.mergedInventory).toEqual(resolved.inventory)

    const quiver = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:quiver',
    )
    expect(quiver).toMatchObject({
      isContainer: true,
      location: { kind: 'carried' },
    })

    const arrows = resolved.entries.filter(
      (entry) => entry.itemId === 'srd-2024:arrows',
    )
    expect(arrows).toHaveLength(1)
    expect(arrows[0]).toMatchObject({
      quantity: 20,
      location: {
        kind: 'container',
        containerInstanceId: quiver?.instanceId,
      },
    })

    const backpack = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:backpack',
    )
    expect(backpack?.isContainer).toBe(true)

    const torch = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:torch',
    )
    expect(torch).toMatchObject({
      quantity: 10,
      location: {
        kind: 'container',
        containerInstanceId: backpack?.instanceId,
      },
    })

    const chainMail = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:chain-mail',
    )
    expect(chainMail).toMatchObject({
      location: { kind: 'carried' },
      weightLb: 55,
      costGp: 75,
    })

    expect(resolved.weightCarriedLb).toBeGreaterThan(50)
    expect(isClassStartingEquipmentResolved(resolved, fighter.instanceId)).toBe(
      true,
    )
  })

  it('keeps same itemId in separate containers as distinct entries', async () => {
    const fighter = createTestFighterClassInstance()
    const character = createDefaultCharacter({
      ...withSingleClassInstance(fighter),
      equipment: {
        selections: [
          {
            source: {
              kind: 'class-instance',
              instanceId: fighter.instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: 'package-b',
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

    const arrows = resolved.entries.filter(
      (entry) => entry.itemId === 'srd-2024:arrows',
    )
    const quiver = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:quiver',
    )
    const backpack = resolved.entries.find(
      (entry) => entry.itemId === 'srd-2024:backpack',
    )

    expect(arrows).toHaveLength(1)
    expect(arrows[0]?.location).toEqual({
      kind: 'container',
      containerInstanceId: quiver?.instanceId,
    })
    expect(backpack).toBeDefined()
    expect(
      resolved.mergedInventory.find((item) => item.itemId === 'srd-2024:arrows')
        ?.quantity,
    ).toBe(20)
  })

  it('resolves Monk nested artisan tools and skips them for gold', async () => {
    const monkInstance = {
      instanceId: 'monk-1',
      classId: 'srd-2024:monk',
      level: 1 as const,
      choices: {},
    }

    const packageCharacter = createDefaultCharacter({
      ...withSingleClassInstance(monkInstance),
      equipment: {
        selections: [
          {
            source: {
              kind: 'class-instance',
              instanceId: monkInstance.instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          {
            source: {
              kind: 'class-instance',
              instanceId: monkInstance.instanceId,
            },
            entitlementId: 'artisan-tools',
            path: ['package-a'],
            optionId: null,
            choices: [{ itemId: 'srd-2024:smiths-tools', quantity: 1 }],
          },
        ],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    })

    const packageResolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      packageCharacter,
    )

    expect(packageResolved.sources[0]?.isComplete).toBe(true)
    expect(
      packageResolved.sources[0]?.items.map((item) => item.itemId),
    ).toEqual(
      expect.arrayContaining([
        'srd-2024:spear',
        'srd-2024:smiths-tools',
        'srd-2024:torch',
      ]),
    )
    expect(
      packageResolved.sources[0]?.items.some(
        (item) => item.itemId === 'srd-2024:artisans-tools',
      ),
    ).toBe(false)

    const goldCharacter = createDefaultCharacter({
      ...withSingleClassInstance(monkInstance),
      equipment: {
        selections: [
          {
            source: {
              kind: 'class-instance',
              instanceId: monkInstance.instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: 'gold-alternative',
            choices: [],
          },
        ],
        loadout: EMPTY_EQUIPMENT_LOADOUT,
      },
    })

    const goldResolved = await resolveCharacterEquipment(
      classCatalog,
      backgroundCatalog,
      equipmentCatalog,
      goldCharacter,
    )

    expect(goldResolved.sources[0]?.isComplete).toBe(true)
    expect(goldResolved.sources[0]?.entitlements).toHaveLength(1)
    expect(goldResolved.currency.goldPieces).toBe(50)
    expect(
      goldResolved.inventory.some(
        (item) => item.itemId === 'srd-2024:smiths-tools',
      ),
    ).toBe(false)
  })

  it('keeps invalid choose-items picks incomplete without rewriting', async () => {
    const monkInstance = {
      instanceId: 'monk-1',
      classId: 'srd-2024:monk',
      level: 1 as const,
      choices: {},
    }

    const character = createDefaultCharacter({
      ...withSingleClassInstance(monkInstance),
      equipment: {
        selections: [
          {
            source: {
              kind: 'class-instance',
              instanceId: monkInstance.instanceId,
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          {
            source: {
              kind: 'class-instance',
              instanceId: monkInstance.instanceId,
            },
            entitlementId: 'artisan-tools',
            path: ['package-a'],
            optionId: null,
            choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
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

    expect(resolved.sources[0]?.isComplete).toBe(false)
    const artisan = resolved.sources[0]?.entitlements.find(
      (entry) => entry.entitlement.id === 'artisan-tools',
    )
    expect(artisan?.isComplete).toBe(false)
    expect(artisan?.selection?.choices[0]?.itemId).toBe('srd-2024:dice-set')
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
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          ...soldierPackageSelections(),
          {
            source: {
              kind: 'background',
              backgroundId: 'srd-2024:sage',
            },
            entitlementId: STARTING_EQUIPMENT_ENTITLEMENT_ID,
            path: [],
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
        equipmentSelectionKey(
          source.source,
          entitlement.entitlement.id,
          entitlement.path,
        ),
      ),
    )

    const pruned = pruneInactiveEquipmentSelections(character, activeKeys)
    expect(pruned).toHaveLength(3)
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
