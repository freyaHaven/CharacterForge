import { describe, expect, it } from 'vitest'
import { createDefaultCharacter } from '../../../domain/character/defaults'
import { equipmentSelectionKey } from '../../../domain/equipment/sourceKey'
import type { EquipmentSelection } from '../../../domain/equipment/types'
import {
  pruneInactiveEquipmentSelections,
  pruneUnreachableEquipmentSelectionsForOptionChange,
  upsertEquipmentOptionSelection,
} from '../pruneInactiveEquipmentSelections'

const source = {
  kind: 'class-instance' as const,
  instanceId: 'monk-1',
}

describe('pruneInactiveEquipmentSelections', () => {
  it('prunes by source+entitlement+path keys', () => {
    const character = createDefaultCharacter({
      equipment: {
        selections: [
          {
            source,
            entitlementId: 'starting-equipment',
            path: [],
            optionId: 'package-a',
            choices: [],
          },
          {
            source,
            entitlementId: 'artisan-tools',
            path: ['package-a'],
            optionId: null,
            choices: [{ itemId: 'srd-2024:smiths-tools', quantity: 1 }],
          },
        ],
        loadout: createDefaultCharacter().equipment.loadout,
      },
    })

    const pruned = pruneInactiveEquipmentSelections(character, [
      equipmentSelectionKey(source, 'starting-equipment', []),
    ])

    expect(pruned).toHaveLength(1)
    expect(pruned[0]?.entitlementId).toBe('starting-equipment')
  })

  it('clears nested package selections when upserting gold', () => {
    const withNested: EquipmentSelection[] = [
      {
        source,
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'package-a',
        choices: [],
      },
      {
        source,
        entitlementId: 'artisan-tools',
        path: ['package-a'],
        optionId: null,
        choices: [{ itemId: 'srd-2024:smiths-tools', quantity: 1 }],
      },
    ]

    const afterGold = upsertEquipmentOptionSelection(
      withNested,
      source,
      'starting-equipment',
      'gold-alternative',
      [],
    )

    expect(afterGold).toEqual([
      {
        source,
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'gold-alternative',
        choices: [],
      },
    ])
  })

  it('filters sibling branches under a choose-option path', () => {
    const selections: EquipmentSelection[] = [
      {
        source,
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'package-a',
        choices: [],
      },
      {
        source,
        entitlementId: 'artisan-tools',
        path: ['package-a'],
        optionId: null,
        choices: [{ itemId: 'srd-2024:smiths-tools', quantity: 1 }],
      },
      {
        source,
        entitlementId: 'other',
        path: ['package-b'],
        optionId: null,
        choices: [],
      },
    ]

    const pruned = pruneUnreachableEquipmentSelectionsForOptionChange(
      selections,
      source,
      [],
      'package-a',
    )

    expect(
      pruned.map((entry) =>
        equipmentSelectionKey(entry.source, entry.entitlementId, entry.path),
      ),
    ).toEqual([
      equipmentSelectionKey(source, 'starting-equipment', []),
      equipmentSelectionKey(source, 'artisan-tools', ['package-a']),
    ])
  })
})
