import type {
  EquipmentEntitlement,
  EquipmentGrant,
  StartingEquipmentDefinition,
} from './types'
import {
  ARTISAN_TOOL_IDS,
  GAMING_SET_IDS,
} from '../tools/types'

const STARTING_EQUIPMENT_ENTITLEMENT_ID = 'starting-equipment'
const PACKAGE_OPTION_ID = 'equipment-package'
const GOLD_OPTION_ID = 'gold-alternative'

const srdId = (slug: string) => `srd-2024:${slug}`

/** Catalogue ids for every artisan tool (equipment defs tagged `artisan-tools`). */
export const ARTISAN_TOOL_EQUIPMENT_IDS = ARTISAN_TOOL_IDS.map(srdId)

/** Catalogue ids for every gaming set (equipment defs tagged `gaming-set`). */
export const GAMING_SET_EQUIPMENT_IDS = GAMING_SET_IDS.map(srdId)

type BackgroundStartingEquipmentOptions = {
  goldPieces?: number
  packageEntitlements?: EquipmentEntitlement[]
  packageSummary?: string
}

/**
 * Standard background starting equipment: package (A) vs GP (B).
 */
export function createBackgroundStartingEquipment(
  packageItems: readonly EquipmentGrant[],
  goldPiecesOrOptions: number | BackgroundStartingEquipmentOptions = 50,
): StartingEquipmentDefinition {
  const options: BackgroundStartingEquipmentOptions =
    typeof goldPiecesOrOptions === 'number'
      ? { goldPieces: goldPiecesOrOptions }
      : goldPiecesOrOptions
  const goldPieces = options.goldPieces ?? 50

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
            ...(options.packageEntitlements !== undefined
              ? { entitlements: options.packageEntitlements }
              : {}),
            ...(options.packageSummary !== undefined
              ? { summary: options.packageSummary }
              : {}),
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
  packageEntitlements?: EquipmentEntitlement[]
  packageSummary?: string
}): StartingEquipmentDefinition {
  return createClassPackageOrGoldStartingEquipment({
    completeness: 'complete',
    options: [
      {
        id: 'package-a',
        label: input.packageLabel ?? 'Package A',
        kind: 'items',
        items: input.items,
        ...(input.packageEntitlements !== undefined
          ? { entitlements: input.packageEntitlements }
          : {}),
        ...(input.packageSummary !== undefined
          ? { summary: input.packageSummary }
          : {}),
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
    | {
        id: string
        label: string
        kind: 'items'
        items: readonly EquipmentGrant[]
        entitlements?: StartingEquipmentDefinition['entitlements']
        summary?: string
      }
    | {
        id: string
        label: string
        kind: 'gold'
        goldPieces: number
        summary?: string
      }
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
                ...(option.entitlements !== undefined
                  ? { entitlements: option.entitlements }
                  : {}),
                ...(option.summary !== undefined
                  ? { summary: option.summary }
                  : {}),
              }
            : {
                id: option.id,
                label: option.label,
                kind: 'gold' as const,
                goldPieces: option.goldPieces,
                ...(option.summary !== undefined
                  ? { summary: option.summary }
                  : {}),
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
