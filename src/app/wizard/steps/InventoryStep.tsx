import type { AbilityScores, EditionId } from '../../../domain/types'
import type {
  EquipmentLoadout,
  InventoryLocation,
} from '../../../domain/equipment/types'
import type {
  AddCatalogueInventoryItemInput,
  AddCustomInventoryItemInput,
  InventoryMutationResult,
} from '../../../domain/equipment/inventoryMutations'
import type { EquipmentCatalog } from '../../../domain/ports/equipmentCatalog'
import type { ResolvedInventoryEntry } from '../../../rules/character/resolveCharacterEquipment'
import { InventoryPage } from '../../../features/equipment/InventoryPage'
import { useEquipmentDefinitions } from '../../../features/equipment/useEquipmentDefinitions'

export type InventoryStepProps = {
  entries: readonly ResolvedInventoryEntry[]
  loadout: EquipmentLoadout
  goldPieces: number
  abilityScores: AbilityScores
  editionId: EditionId
  seeded: boolean
  equipmentCatalog: EquipmentCatalog
  onSetQuantity: (
    instanceId: string,
    quantity: number,
  ) => Promise<InventoryMutationResult>
  onAdjustQuantity: (
    instanceId: string,
    delta: number,
  ) => Promise<InventoryMutationResult>
  onRemove: (instanceId: string) => Promise<InventoryMutationResult>
  onMove: (
    instanceId: string,
    location: InventoryLocation,
  ) => Promise<InventoryMutationResult>
  onSplit: (
    instanceId: string,
    quantity: number,
  ) => Promise<InventoryMutationResult>
  onMerge: (
    targetInstanceId: string,
    sourceInstanceId: string,
  ) => Promise<InventoryMutationResult>
  onSetCurrency: (goldPieces: number) => Promise<InventoryMutationResult>
  onAdjustCurrency: (delta: number) => Promise<InventoryMutationResult>
  onAddCatalogueItem: (
    input: AddCatalogueInventoryItemInput,
  ) => Promise<InventoryMutationResult>
  onAddCustomItem: (
    input: AddCustomInventoryItemInput,
  ) => Promise<InventoryMutationResult>
}

export function InventoryStep({
  entries,
  equipmentCatalog,
  ...pageProps
}: InventoryStepProps) {
  const definitionsById = useEquipmentDefinitions(
    entries.map((entry) => ({
      itemId: entry.itemId,
      name: entry.name,
      quantity: entry.quantity,
      category: entry.category,
    })),
    equipmentCatalog,
  )

  return (
    <InventoryPage
      entries={entries}
      definitionsById={definitionsById}
      equipmentCatalog={equipmentCatalog}
      {...pageProps}
    />
  )
}
