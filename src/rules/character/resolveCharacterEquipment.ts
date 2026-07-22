import type { BackgroundCatalog } from '../../domain/ports/backgroundCatalog'
import type { ClassCatalog } from '../../domain/ports/classCatalog'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import type {
  Character,
  CharacterClassSelection,
} from '../../domain/types'
import type {
  EquipmentEntitlement,
  EquipmentGrant,
  EquipmentItemDefinition,
  EquipmentOption,
  EquipmentSelection,
  EquipmentSourceKindLabel,
  EquipmentSourceRef,
  StartingEquipmentDefinition,
} from '../../domain/equipment/types'
import { GOLD_PIECES_ITEM_ID } from '../../domain/equipment/types'
import {
  collectActiveEquipmentNodes,
  collectActiveEquipmentSelectionKeysForDefinition,
} from '../../domain/equipment/equipmentChoiceTree'
import {
  assignDefaultLocations,
  materializeInventoryEntries,
  mergeInventoryQuantities,
  totalWeightLb,
  type MaterializedInventoryEntry,
} from '../../domain/equipment/materializeInventory'

export type ResolvedInventoryItem = {
  itemId: string
  name: string
  quantity: number
  category: EquipmentItemDefinition['category']
}

export type ResolvedInventoryEntry = MaterializedInventoryEntry

export type MergedInventoryLine = ResolvedInventoryItem

export type ResolvedEquipmentEntitlement = {
  entitlement: EquipmentEntitlement
  /** Parent option ids from root; empty for root entitlements. */
  path: string[]
  selection: EquipmentSelection | null
  isComplete: boolean
}

export type ResolvedEquipmentSource = {
  source: EquipmentSourceRef
  label: string
  sourceKindLabel: EquipmentSourceKindLabel
  completeness: StartingEquipmentDefinition['completeness']
  /** Full starting-equipment definition (for pruning / nested walks). */
  definition: StartingEquipmentDefinition
  /** All active entitlement nodes (root + nested under selected branches). */
  entitlements: ResolvedEquipmentEntitlement[]
  /** Location-aware instances granted by this source. */
  entries: ResolvedInventoryEntry[]
  /** Quantity-merged view for this source (summary cards). */
  items: ResolvedInventoryItem[]
  currency: { goldPieces: number }
  isComplete: boolean
}

export type ResolvedEquipment = {
  sources: ResolvedEquipmentSource[]
  /** Instance + location aware inventory (source of truth for Inventory UI). */
  entries: ResolvedInventoryEntry[]
  /**
   * Quantity-merged totals by itemId (Starting Equipment summary / loadout).
   * Does not preserve container locations.
   */
  inventory: ResolvedInventoryItem[]
  /** Alias of `inventory` for callers that prefer the dual-view naming. */
  mergedInventory: MergedInventoryLine[]
  currency: { goldPieces: number }
  weightCarriedLb: number
}

function grantsFromOption(option: EquipmentOption): EquipmentGrant[] {
  if (option.kind === 'gold') {
    return [{ itemId: GOLD_PIECES_ITEM_ID, quantity: option.goldPieces }]
  }

  return option.items
}

function resolveEntitlementGrants(
  entitlement: EquipmentEntitlement,
  selection: EquipmentSelection | null,
): EquipmentGrant[] {
  if (entitlement.type === 'grant') {
    return entitlement.items
  }

  if (entitlement.type === 'choose-option') {
    if (selection?.optionId == null) {
      return []
    }

    const option = entitlement.options.find(
      (entry) => entry.id === selection.optionId,
    )

    return option === undefined ? [] : grantsFromOption(option)
  }

  return (selection?.choices ?? []).map((choice) => ({
    itemId: choice.itemId,
    quantity: choice.quantity,
  }))
}

function toInventoryItems(
  quantities: Map<string, number>,
  catalogById: Map<string, EquipmentItemDefinition>,
): ResolvedInventoryItem[] {
  return [...quantities.entries()]
    .map(([itemId, quantity]) => {
      const definition = catalogById.get(itemId)

      return {
        itemId,
        name: definition?.name ?? itemId,
        quantity,
        category: definition?.category ?? 'gear',
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function loadCatalogMap(
  equipmentCatalog: EquipmentCatalog,
  editionId: Character['editionId'],
): Promise<Map<string, EquipmentItemDefinition>> {
  const items = await equipmentCatalog.listEquipment(editionId)
  return new Map(items.map((entry) => [entry.id, entry]))
}

function resolveSource(input: {
  source: EquipmentSourceRef
  label: string
  sourceKindLabel: EquipmentSourceKindLabel
  definition: StartingEquipmentDefinition
  character: Character
  catalogById: Map<string, EquipmentItemDefinition>
  ordinalStart: number
}): ResolvedEquipmentSource & { nextOrdinal: number } {
  const nodes = collectActiveEquipmentNodes(
    input.definition,
    input.source,
    input.character.equipment.selections,
    input.catalogById,
  )

  const entitlements: ResolvedEquipmentEntitlement[] = nodes.map((node) => ({
    entitlement: node.entitlement,
    path: node.path,
    selection: node.selection,
    isComplete: node.isComplete,
  }))

  const grants = nodes.flatMap((node) =>
    resolveEntitlementGrants(node.entitlement, node.selection),
  )

  const materialized = materializeInventoryEntries(
    grants,
    input.catalogById,
    input.character,
    input.source,
    input.ordinalStart,
  )

  return {
    source: input.source,
    label: input.label,
    sourceKindLabel: input.sourceKindLabel,
    completeness: input.definition.completeness,
    definition: input.definition,
    entitlements,
    entries: materialized.entries,
    items: toInventoryItems(
      mergeInventoryQuantities(materialized.entries),
      input.catalogById,
    ),
    currency: { goldPieces: materialized.goldPieces },
    isComplete: entitlements.every((entry) => entry.isComplete),
    nextOrdinal: materialized.nextOrdinal,
  }
}

export async function resolveCharacterEquipment(
  classCatalog: ClassCatalog,
  backgroundCatalog: BackgroundCatalog,
  equipmentCatalog: EquipmentCatalog,
  character: Character,
): Promise<ResolvedEquipment> {
  const catalogById = await loadCatalogMap(equipmentCatalog, character.editionId)
  const sources: ResolvedEquipmentSource[] = []
  let ordinal = 0

  for (const classSelection of character.classes) {
    const classDefinition = await classCatalog.getClass(classSelection.classId)
    if (classDefinition === null) {
      continue
    }

    const resolved = resolveSource({
      source: {
        kind: 'class-instance',
        instanceId: classSelection.instanceId,
      },
      label: classDefinition.name,
      sourceKindLabel: 'Class',
      definition: classDefinition.startingEquipment,
      character,
      catalogById,
      ordinalStart: ordinal,
    })
    ordinal = resolved.nextOrdinal
    const { nextOrdinal: _next, ...source } = resolved
    sources.push(source)
  }

  if (character.background !== null) {
    const backgroundDefinition = await backgroundCatalog.getBackground(
      character.background.backgroundId,
    )

    if (backgroundDefinition !== null) {
      const resolved = resolveSource({
        source: {
          kind: 'background',
          backgroundId: character.background.backgroundId,
        },
        label: backgroundDefinition.name,
        sourceKindLabel: 'Background',
        definition: backgroundDefinition.equipment,
        character,
        catalogById,
        ordinalStart: ordinal,
      })
      const { nextOrdinal: _next, ...source } = resolved
      sources.push(source)
    }
  }

  const entries = assignDefaultLocations(
    sources.flatMap((source) => source.entries),
  )
  const inventory = toInventoryItems(
    mergeInventoryQuantities(entries),
    catalogById,
  )

  const goldPieces = sources.reduce(
    (total, source) => total + source.currency.goldPieces,
    0,
  )

  return {
    sources,
    entries,
    inventory,
    mergedInventory: inventory,
    currency: { goldPieces },
    weightCarriedLb: totalWeightLb(entries),
  }
}

/**
 * Active selection keys for current class/background definitions, walking
 * nested branches according to `character.equipment.selections`.
 */
export function listActiveEquipmentSelectionKeys(
  character: Character,
  classSelections: readonly CharacterClassSelection[],
  classDefinitionsById: Map<
    string,
    { startingEquipment: StartingEquipmentDefinition }
  >,
  backgroundDefinition: StartingEquipmentDefinition | null,
): string[] {
  const keys: string[] = []

  for (const classSelection of classSelections) {
    const definition = classDefinitionsById.get(classSelection.classId)
    if (definition === undefined) {
      continue
    }

    const source: EquipmentSourceRef = {
      kind: 'class-instance',
      instanceId: classSelection.instanceId,
    }

    keys.push(
      ...collectActiveEquipmentSelectionKeysForDefinition(
        definition.startingEquipment,
        source,
        character.equipment.selections,
      ),
    )
  }

  if (character.background !== null && backgroundDefinition !== null) {
    const source: EquipmentSourceRef = {
      kind: 'background',
      backgroundId: character.background.backgroundId,
    }

    keys.push(
      ...collectActiveEquipmentSelectionKeysForDefinition(
        backgroundDefinition,
        source,
        character.equipment.selections,
      ),
    )
  }

  return keys
}

export function isEquipmentFullyResolved(resolved: ResolvedEquipment): boolean {
  if (resolved.sources.length === 0) {
    return true
  }

  return resolved.sources.every((source) => source.isComplete)
}

export function isClassStartingEquipmentResolved(
  resolved: ResolvedEquipment,
  instanceId: string,
): boolean {
  const source = resolved.sources.find(
    (entry) =>
      entry.source.kind === 'class-instance' &&
      entry.source.instanceId === instanceId,
  )

  return source?.isComplete === true
}
