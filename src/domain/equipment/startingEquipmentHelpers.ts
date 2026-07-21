import type {
  EquipmentGrant,
  StartingEquipmentDefinition,
} from './types'

const STARTING_EQUIPMENT_ENTITLEMENT_ID = 'starting-equipment'
const PACKAGE_OPTION_ID = 'equipment-package'
const GOLD_OPTION_ID = 'gold-alternative'

/**
 * Standard background starting equipment: package (A) vs 50 GP (B).
 */
export function createBackgroundStartingEquipment(
  packageItems: readonly EquipmentGrant[],
  goldPieces = 50,
): StartingEquipmentDefinition {
  return {
    completeness: 'complete',
    entitlements: [
      {
        type: 'choose-option',
        id: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        label: 'Choose starting equipment',
        options: [
          {
            id: PACKAGE_OPTION_ID,
            label: 'Equipment Package (A)',
            kind: 'items',
            items: [...packageItems],
          },
          {
            id: GOLD_OPTION_ID,
            label: `${goldPieces} GP`,
            kind: 'gold',
            goldPieces,
          },
        ],
      },
    ],
  }
}

/**
 * Interim class starting equipment: one package vs gold.
 * Marked simplified so UI can show that full options are not yet authored.
 */
export function createSimplifiedClassStartingEquipment(input: {
  packageLabel: string
  items: readonly EquipmentGrant[]
  goldPieces: number
}): StartingEquipmentDefinition {
  return {
    completeness: 'simplified',
    entitlements: [
      {
        type: 'choose-option',
        id: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        label: 'Choose starting equipment',
        options: [
          {
            id: PACKAGE_OPTION_ID,
            label: input.packageLabel,
            kind: 'items',
            items: [...input.items],
          },
          {
            id: GOLD_OPTION_ID,
            label: `${input.goldPieces} GP`,
            kind: 'gold',
            goldPieces: input.goldPieces,
          },
        ],
      },
    ],
  }
}

/**
 * SRD 2024 class starting equipment: Package A (items) vs gold (option B in the SRD).
 */
export function createCompleteClassPackageOrGoldStartingEquipment(input: {
  packageLabel?: string
  items: readonly EquipmentGrant[]
  goldPieces: number
}): StartingEquipmentDefinition {
  return createClassPackageOrGoldStartingEquipment({
    completeness: 'complete',
    options: [
      {
        id: 'package-a',
        label: input.packageLabel ?? 'Package A',
        kind: 'items',
        items: input.items,
      },
      {
        id: 'gold-alternative',
        label: `${input.goldPieces} GP`,
        kind: 'gold',
        goldPieces: input.goldPieces,
      },
    ],
  })
}

export function createClassPackageOrGoldStartingEquipment(input: {
  completeness: StartingEquipmentDefinition['completeness']
  options: Array<
    | { id: string; label: string; kind: 'items'; items: readonly EquipmentGrant[] }
    | { id: string; label: string; kind: 'gold'; goldPieces: number }
  >
}): StartingEquipmentDefinition {
  return {
    completeness: input.completeness,
    entitlements: [
      {
        type: 'choose-option',
        id: STARTING_EQUIPMENT_ENTITLEMENT_ID,
        label: 'Choose starting equipment',
        options: input.options.map((option) =>
          option.kind === 'items'
            ? {
                id: option.id,
                label: option.label,
                kind: 'items' as const,
                items: [...option.items],
              }
            : {
                id: option.id,
                label: option.label,
                kind: 'gold' as const,
                goldPieces: option.goldPieces,
              },
        ),
      },
    ],
  }
}

export {
  STARTING_EQUIPMENT_ENTITLEMENT_ID,
  PACKAGE_OPTION_ID,
  GOLD_OPTION_ID,
}
