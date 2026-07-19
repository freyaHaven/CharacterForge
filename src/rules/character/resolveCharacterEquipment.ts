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
import {
  GOLD_PIECES_ITEM_ID,
  SELECTED_GAMING_SET_ITEM_ID,
} from '../../domain/equipment/types'
import {
  equipmentSelectionKey,
  equipmentSourcesEqual,
} from '../../domain/equipment/sourceKey'

export type ResolvedInventoryItem = {
  itemId: string
  name: string
  quantity: number
  category: EquipmentItemDefinition['category']
}

export type ResolvedEquipmentEntitlement = {
  entitlement: EquipmentEntitlement
  selection: EquipmentSelection | null
  isComplete: boolean
}

export type ResolvedEquipmentSource = {
  source: EquipmentSourceRef
  label: string
  sourceKindLabel: EquipmentSourceKindLabel
  completeness: StartingEquipmentDefinition['completeness']
  entitlements: ResolvedEquipmentEntitlement[]
  items: ResolvedInventoryItem[]
  currency: { goldPieces: number }
  isComplete: boolean
}

export type ResolvedEquipment = {
  sources: ResolvedEquipmentSource[]
  inventory: ResolvedInventoryItem[]
  currency: { goldPieces: number }
}

function findSelection(
  selections: readonly EquipmentSelection[],
  source: EquipmentSourceRef,
  entitlementId: string,
): EquipmentSelection | null {
  return (
    selections.find(
      (entry) =>
        equipmentSourcesEqual(entry.source, source) &&
        entry.entitlementId === entitlementId,
    ) ?? null
  )
}

function isEntitlementComplete(
  entitlement: EquipmentEntitlement,
  selection: EquipmentSelection | null,
): boolean {
  if (entitlement.type === 'grant') {
    return true
  }

  if (entitlement.type === 'choose-option') {
    if (selection?.optionId == null) {
      return false
    }

    return entitlement.options.some((option) => option.id === selection.optionId)
  }

  const chosen = selection?.choices.length ?? 0
  return chosen >= entitlement.count
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

function resolveGamingSetItemId(
  character: Character,
  itemId: string,
): string {
  if (itemId !== SELECTED_GAMING_SET_ITEM_ID) {
    return itemId
  }

  const selected = character.background?.choices['gaming-set']
  if (typeof selected !== 'string' || selected.length === 0) {
    return SELECTED_GAMING_SET_ITEM_ID
  }

  return selected.startsWith('srd-2024:') ? selected : `srd-2024:${selected}`
}

function expandAndNormalizeGrants(
  grants: readonly EquipmentGrant[],
  catalogById: Map<string, EquipmentItemDefinition>,
  character: Character,
): { items: Map<string, number>; goldPieces: number } {
  const quantities = new Map<string, number>()
  let goldPieces = 0

  const addGrant = (grant: EquipmentGrant) => {
    const resolvedId = resolveGamingSetItemId(character, grant.itemId)

    if (resolvedId === GOLD_PIECES_ITEM_ID) {
      goldPieces += grant.quantity
      return
    }

    const definition = catalogById.get(resolvedId)
    if (definition?.expandsTo !== undefined && definition.expandsTo.length > 0) {
      for (const nested of definition.expandsTo) {
        addGrant(nested)
      }
      return
    }

    quantities.set(
      resolvedId,
      (quantities.get(resolvedId) ?? 0) + grant.quantity,
    )
  }

  for (const grant of grants) {
    addGrant(grant)
  }

  return { items: quantities, goldPieces }
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

function mergeQuantityMaps(
  maps: readonly Map<string, number>[],
): Map<string, number> {
  const merged = new Map<string, number>()

  for (const map of maps) {
    for (const [itemId, quantity] of map) {
      merged.set(itemId, (merged.get(itemId) ?? 0) + quantity)
    }
  }

  return merged
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
}): ResolvedEquipmentSource {
  const entitlements: ResolvedEquipmentEntitlement[] =
    input.definition.entitlements.map((entitlement) => {
      const selection = findSelection(
        input.character.equipment.selections,
        input.source,
        entitlement.id,
      )

      return {
        entitlement,
        selection,
        isComplete: isEntitlementComplete(entitlement, selection),
      }
    })

  const grants = entitlements.flatMap((entry) =>
    resolveEntitlementGrants(entry.entitlement, entry.selection),
  )

  const normalized = expandAndNormalizeGrants(
    grants,
    input.catalogById,
    input.character,
  )

  return {
    source: input.source,
    label: input.label,
    sourceKindLabel: input.sourceKindLabel,
    completeness: input.definition.completeness,
    entitlements,
    items: toInventoryItems(normalized.items, input.catalogById),
    currency: { goldPieces: normalized.goldPieces },
    isComplete: entitlements.every((entry) => entry.isComplete),
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

  for (const classSelection of character.classes) {
    const classDefinition = await classCatalog.getClass(classSelection.classId)
    if (classDefinition === null) {
      continue
    }

    sources.push(
      resolveSource({
        source: {
          kind: 'class-instance',
          instanceId: classSelection.instanceId,
        },
        label: classDefinition.name,
        sourceKindLabel: 'Class',
        definition: classDefinition.startingEquipment,
        character,
        catalogById,
      }),
    )
  }

  if (character.background !== null) {
    const backgroundDefinition = await backgroundCatalog.getBackground(
      character.background.backgroundId,
    )

    if (backgroundDefinition !== null) {
      sources.push(
        resolveSource({
          source: {
            kind: 'background',
            backgroundId: character.background.backgroundId,
          },
          label: backgroundDefinition.name,
          sourceKindLabel: 'Background',
          definition: backgroundDefinition.equipment,
          character,
          catalogById,
        }),
      )
    }
  }

  const inventory = toInventoryItems(
    mergeQuantityMaps(sources.map((source) => {
      const map = new Map<string, number>()
      for (const item of source.items) {
        map.set(item.itemId, item.quantity)
      }
      return map
    })),
    catalogById,
  )

  const goldPieces = sources.reduce(
    (total, source) => total + source.currency.goldPieces,
    0,
  )

  return {
    sources,
    inventory,
    currency: { goldPieces },
  }
}

export function listActiveEquipmentSelectionKeys(
  character: Character,
  classSelections: readonly CharacterClassSelection[],
  classDefinitionsById: Map<string, { startingEquipment: StartingEquipmentDefinition }>,
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

    for (const entitlement of definition.startingEquipment.entitlements) {
      keys.push(equipmentSelectionKey(source, entitlement.id))
    }
  }

  if (character.background !== null && backgroundDefinition !== null) {
    const source: EquipmentSourceRef = {
      kind: 'background',
      backgroundId: character.background.backgroundId,
    }

    for (const entitlement of backgroundDefinition.entitlements) {
      keys.push(equipmentSelectionKey(source, entitlement.id))
    }
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
