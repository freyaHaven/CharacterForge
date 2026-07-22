import type {
  CustomInventoryItemDefinition,
  EquipmentItemCategory,
  EquipmentItemDefinition,
  InventoryCatalogSnapshot,
  InventoryEntry,
} from './types'

export const CUSTOM_ITEM_ID_PREFIX = 'custom:'

const EQUIPMENT_CATEGORIES: readonly EquipmentItemCategory[] = [
  'weapon',
  'armor',
  'shield',
  'ammunition',
  'tool',
  'gear',
  'container',
  'currency',
]

export function isEquipmentItemCategory(
  value: unknown,
): value is EquipmentItemCategory {
  return (
    typeof value === 'string' &&
    (EQUIPMENT_CATEGORIES as readonly string[]).includes(value)
  )
}

export function isCustomItemId(itemId: string): boolean {
  return itemId.startsWith(CUSTOM_ITEM_ID_PREFIX)
}

export function createCustomItemId(): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `${CUSTOM_ITEM_ID_PREFIX}${suffix}`
}

export function createCatalogSnapshot(
  definition: Pick<EquipmentItemDefinition, 'name' | 'category'>,
): InventoryCatalogSnapshot {
  return {
    name: definition.name,
    category: definition.category,
  }
}

/**
 * Synthetic catalogue definition for mutation / weight helpers.
 * Custom items are never equippable through this projection (no armor/weapon
 * combat properties).
 */
export function definitionFromCustomItem(
  custom: CustomInventoryItemDefinition,
): EquipmentItemDefinition {
  return {
    id: custom.id,
    editionId: 'srd-2024',
    name: custom.name,
    category: custom.category ?? 'gear',
    source: {
      id: 'character-custom',
      name: 'Custom item',
      version: '1',
      licence: 'proprietary',
      attribution: 'Character Forge custom inventory item',
      documentUrl: '',
    },
    notes: custom.notes,
    weightLb: custom.weightLb,
    costGp: custom.costGp,
  }
}

export function mergeCustomDefinitionsIntoCatalog(
  catalogById: ReadonlyMap<string, EquipmentItemDefinition>,
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>>,
): Map<string, EquipmentItemDefinition> {
  const merged = new Map(catalogById)
  for (const custom of Object.values(customItems)) {
    if (!merged.has(custom.id)) {
      merged.set(custom.id, definitionFromCustomItem(custom))
    }
  }
  return merged
}

export function pruneUnusedCustomItems(
  customItems: Readonly<Record<string, CustomInventoryItemDefinition>>,
  entries: readonly InventoryEntry[],
): Record<string, CustomInventoryItemDefinition> {
  const used = new Set(entries.map((entry) => entry.itemId))
  const next: Record<string, CustomInventoryItemDefinition> = {}
  for (const [id, definition] of Object.entries(customItems)) {
    if (used.has(id)) {
      next[id] = definition
    }
  }
  return next
}

export function areCustomDefinitionsEquivalent(
  left: CustomInventoryItemDefinition | undefined,
  right: CustomInventoryItemDefinition | undefined,
): boolean {
  if (left === undefined || right === undefined) {
    return false
  }

  return (
    left.id === right.id &&
    left.name === right.name &&
    (left.notes ?? '') === (right.notes ?? '') &&
    left.weightLb === right.weightLb &&
    left.costGp === right.costGp &&
    (left.category ?? 'gear') === (right.category ?? 'gear')
  )
}

export function isValidCustomItemName(name: string): boolean {
  return name.trim().length > 0
}

export function isValidOptionalNonNegativeFinite(
  value: number | undefined | null,
): boolean {
  if (value === undefined || value === null) {
    return true
  }
  return Number.isFinite(value) && value >= 0
}
