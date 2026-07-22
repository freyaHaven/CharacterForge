import { describe, expect, it } from 'vitest'
import {
  collectActiveEquipmentNodes,
  collectActiveEquipmentSelectionKeysForDefinition,
  isEquipmentEntitlementComplete,
} from '../equipmentChoiceTree'
import type {
  EquipmentItemDefinition,
  EquipmentSelection,
  StartingEquipmentDefinition,
} from '../types'
import { equipmentSelectionKey } from '../sourceKey'

const source = {
  kind: 'class-instance' as const,
  instanceId: 'monk-1',
}

const contentSource = {
  id: 'srd-2024',
  name: 'SRD',
  version: '5.2.1',
  licence: 'CC-BY-4.0',
  attribution: 'test',
  documentUrl: 'https://example.test',
}

const artisanCatalog = new Map<string, EquipmentItemDefinition>([
  [
    'srd-2024:smiths-tools',
    {
      id: 'srd-2024:smiths-tools',
      editionId: 'srd-2024',
      name: "Smith's Tools",
      category: 'tool',
      source: contentSource,
      tags: ['artisan-tools'],
    },
  ],
  [
    'srd-2024:dice-set',
    {
      id: 'srd-2024:dice-set',
      editionId: 'srd-2024',
      name: 'Dice Set',
      category: 'tool',
      source: contentSource,
      tags: ['gaming-set'],
    },
  ],
])

const nestedDefinition: StartingEquipmentDefinition = {
  completeness: 'complete',
  entitlements: [
    {
      type: 'choose-option',
      id: 'starting-equipment',
      label: 'Choose starting equipment',
      options: [
        {
          id: 'package-a',
          label: 'Package A',
          kind: 'items',
          items: [{ itemId: 'srd-2024:spear', quantity: 1 }],
          entitlements: [
            {
              type: 'choose-items',
              id: 'artisan-tools',
              label: "Choose artisan's tools",
              count: 1,
              catalogueFilter: { kind: 'tags', tags: ['artisan-tools'] },
            },
          ],
        },
        {
          id: 'gold-alternative',
          label: '50 GP',
          kind: 'gold',
          goldPieces: 50,
        },
      ],
    },
  ],
}

describe('equipmentChoiceTree', () => {
  it('walks nested entitlements only under the selected package', () => {
    const packageSelections: EquipmentSelection[] = [
      {
        source,
        entitlementId: 'starting-equipment',
        path: [],
        optionId: 'package-a',
        choices: [],
      },
    ]

    const packageNodes = collectActiveEquipmentNodes(
      nestedDefinition,
      source,
      packageSelections,
      artisanCatalog,
    )
    expect(packageNodes.map((node) => node.entitlement.id)).toEqual([
      'starting-equipment',
      'artisan-tools',
    ])
    expect(packageNodes[1]?.path).toEqual(['package-a'])
    expect(packageNodes[1]?.isComplete).toBe(false)

    const goldNodes = collectActiveEquipmentNodes(
      nestedDefinition,
      source,
      [
        {
          source,
          entitlementId: 'starting-equipment',
          path: [],
          optionId: 'gold-alternative',
          choices: [],
        },
      ],
      artisanCatalog,
    )
    expect(goldNodes.map((node) => node.entitlement.id)).toEqual([
      'starting-equipment',
    ])
    expect(goldNodes[0]?.isComplete).toBe(true)
  })

  it('marks choose-items complete only when picks match filter and count', () => {
    const entitlement = nestedDefinition.entitlements[0]
    expect(entitlement?.type).toBe('choose-option')
    if (entitlement?.type !== 'choose-option') {
      return
    }
    const nested = entitlement.options[0]
    expect(nested?.kind).toBe('items')
    if (nested?.kind !== 'items') {
      return
    }
    const chooseItems = nested.entitlements?.[0]
    expect(chooseItems?.type).toBe('choose-items')
    if (chooseItems?.type !== 'choose-items') {
      return
    }

    expect(
      isEquipmentEntitlementComplete(
        chooseItems,
        {
          source,
          entitlementId: 'artisan-tools',
          path: ['package-a'],
          optionId: null,
          choices: [{ itemId: 'srd-2024:dice-set', quantity: 1 }],
        },
        artisanCatalog,
      ),
    ).toBe(false)

    expect(
      isEquipmentEntitlementComplete(
        chooseItems,
        {
          source,
          entitlementId: 'artisan-tools',
          path: ['package-a'],
          optionId: null,
          choices: [{ itemId: 'srd-2024:smiths-tools', quantity: 1 }],
        },
        artisanCatalog,
      ),
    ).toBe(true)
  })

  it('lists active selection keys including nested paths', () => {
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
    ]

    expect(
      collectActiveEquipmentSelectionKeysForDefinition(
        nestedDefinition,
        source,
        selections,
      ),
    ).toEqual([
      equipmentSelectionKey(source, 'starting-equipment', []),
      equipmentSelectionKey(source, 'artisan-tools', ['package-a']),
    ])
  })

  it('keeps optional incomplete entitlements from blocking completeness', () => {
    const definition: StartingEquipmentDefinition = {
      completeness: 'complete',
      entitlements: [
        {
          type: 'choose-items',
          id: 'optional-kit',
          label: 'Optional kit',
          count: 1,
          required: false,
          catalogueFilter: { kind: 'tags', tags: ['artisan-tools'] },
        },
      ],
    }

    const nodes = collectActiveEquipmentNodes(definition, source, [], artisanCatalog)
    expect(nodes[0]?.isComplete).toBe(true)
  })
})
