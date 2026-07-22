import { isStorageContainer } from './inventory'
import type {
  EquipmentItemDefinition,
  InventoryEntry,
  InventoryLocation,
} from './types'

/** SRD 2024: carrying capacity = Strength score × 15 (pounds). */
export const SRD_2024_CARRYING_CAPACITY_MULTIPLIER = 15

export type InventoryWeightEntryInput = {
  instanceId: string
  itemId: string
  quantity: number
  location: InventoryLocation
}

export type EntryWeightDetail = {
  instanceId: string
  itemId: string
  quantity: number
  /** Unit weight from the catalogue; `null` when unknown. */
  unitWeightLb: number | null
  /** `unitWeightLb * quantity` when known; otherwise `null`. */
  stackWeightLb: number | null
  weightKnown: boolean
  location: InventoryLocation
  isContainer: boolean
}

export type ContainerWeightDetail = {
  containerInstanceId: string
  /** Known weight of items stored in this container (direct + nested). */
  knownContentsWeightLb: number
  unknownContentsCount: number
  /** Known weight of the container item itself (not its contents). */
  knownSelfWeightLb: number | null
  selfWeightKnown: boolean
}

export type InventoryWeightBreakdown = {
  entries: EntryWeightDetail[]
  /**
   * Sum of known stack weights for every owned entry.
   * Container location does not remove weight — all owned gear counts.
   */
  knownTotalLb: number
  unknownEntryCount: number
  isComplete: boolean
  /**
   * Known weight of entries whose location is `carried`
   * (includes carried containers' own weight, not nested contents).
   */
  carriedDirectKnownLb: number
  byContainer: ReadonlyMap<string, ContainerWeightDetail>
  /** Entry instance ids whose container location points at a missing instance. */
  invalidContainerRefs: readonly string[]
  /** True when a containment cycle was detected while aggregating. */
  cycleDetected: boolean
}

export type CarryingLoadStatus =
  | 'under-capacity'
  | 'at-capacity'
  | 'overloaded'
  | 'incomplete-under-capacity'
  | 'incomplete-overloaded'

export type CarryingLoadResult = {
  strengthScore: number
  capacityLb: number
  knownWeightLb: number
  /** `capacityLb - knownWeightLb` (negative when overloaded). */
  remainingLb: number
  /**
   * Known weight as a percentage of capacity (may exceed 100 when overloaded).
   * Based on the known minimum total when incomplete.
   */
  percentUsed: number
  overloaded: boolean
  incompleteTotal: boolean
  status: CarryingLoadStatus
}

function roundTenths(value: number): number {
  return Math.round(value * 10) / 10
}

function isValidQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0
}

export function resolveUnitWeightLb(
  itemId: string,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): number | null {
  const definition = definitionsById.get(itemId)
  if (definition === undefined) {
    return null
  }

  if (
    definition.weightLb === undefined ||
    !Number.isFinite(definition.weightLb)
  ) {
    return null
  }

  return definition.weightLb
}

function toEntryDetail(
  entry: InventoryWeightEntryInput,
  unitWeightLb: number | null,
  isContainer: boolean,
): EntryWeightDetail {
  const quantity = isValidQuantity(entry.quantity) ? entry.quantity : 0
  const weightKnown = unitWeightLb !== null && quantity > 0
  const stackWeightLb = weightKnown
    ? roundTenths(unitWeightLb * quantity)
    : null

  return {
    instanceId: entry.instanceId,
    itemId: entry.itemId,
    quantity: entry.quantity,
    unitWeightLb: quantity > 0 ? unitWeightLb : null,
    stackWeightLb,
    weightKnown,
    location: entry.location,
    isContainer,
  }
}

export function calculateEntryWeight(
  entry: InventoryWeightEntryInput,
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): EntryWeightDetail {
  const definition = definitionsById.get(entry.itemId)
  return toEntryDetail(
    entry,
    resolveUnitWeightLb(entry.itemId, definitionsById),
    isStorageContainer(definition),
  )
}

/**
 * Walk an entry's container chain upward to see if it is nested under `containerId`.
 * Cycle-safe for malformed imported/legacy data.
 */
function isNestedUnderContainer(
  entry: EntryWeightDetail,
  containerId: string,
  entriesById: ReadonlyMap<string, EntryWeightDetail>,
): { nested: boolean; cycleDetected: boolean; invalidRef: boolean } {
  if (entry.location.kind !== 'container') {
    return { nested: false, cycleDetected: false, invalidRef: false }
  }

  let currentId: string | null = entry.location.containerInstanceId
  const seen = new Set<string>()

  while (currentId !== null) {
    if (currentId === containerId) {
      return { nested: true, cycleDetected: false, invalidRef: false }
    }
    if (seen.has(currentId)) {
      return { nested: false, cycleDetected: true, invalidRef: false }
    }
    seen.add(currentId)

    const parent = entriesById.get(currentId)
    if (parent === undefined) {
      return { nested: false, cycleDetected: false, invalidRef: true }
    }
    if (parent.location.kind !== 'container') {
      return { nested: false, cycleDetected: false, invalidRef: false }
    }
    currentId = parent.location.containerInstanceId
  }

  return { nested: false, cycleDetected: false, invalidRef: false }
}

function aggregateFromDetails(
  details: EntryWeightDetail[],
): InventoryWeightBreakdown {
  const entriesById = new Map(
    details.map((entry) => [entry.instanceId, entry] as const),
  )

  let knownTotalLb = 0
  let unknownEntryCount = 0
  let carriedDirectKnownLb = 0
  const invalidContainerRefs: string[] = []
  let cycleDetected = false

  for (const entry of details) {
    if (entry.weightKnown && entry.stackWeightLb !== null) {
      knownTotalLb += entry.stackWeightLb
      if (entry.location.kind === 'carried') {
        carriedDirectKnownLb += entry.stackWeightLb
      }
    } else if (isValidQuantity(entry.quantity)) {
      unknownEntryCount += 1
    }

    if (entry.location.kind === 'container') {
      if (!entriesById.has(entry.location.containerInstanceId)) {
        invalidContainerRefs.push(entry.instanceId)
      }

      // Walk parent chain from this entry to detect cycles in malformed data.
      let currentId: string | null = entry.location.containerInstanceId
      const seen = new Set<string>([entry.instanceId])
      while (currentId !== null) {
        if (seen.has(currentId)) {
          cycleDetected = true
          break
        }
        seen.add(currentId)
        const parent = entriesById.get(currentId)
        if (parent === undefined || parent.location.kind !== 'container') {
          break
        }
        currentId = parent.location.containerInstanceId
      }
    }
  }

  const referencedContainerIds = new Set<string>()
  for (const entry of details) {
    if (entry.location.kind === 'container') {
      referencedContainerIds.add(entry.location.containerInstanceId)
    }
  }

  const byContainer = new Map<string, ContainerWeightDetail>()
  for (const entry of details) {
    if (!entry.isContainer && !referencedContainerIds.has(entry.instanceId)) {
      continue
    }

    let knownContentsWeightLb = 0
    let unknownContentsCount = 0

    for (const candidate of details) {
      if (candidate.instanceId === entry.instanceId) {
        continue
      }
      const nest = isNestedUnderContainer(
        candidate,
        entry.instanceId,
        entriesById,
      )
      if (nest.cycleDetected) {
        cycleDetected = true
      }
      if (!nest.nested) {
        continue
      }
      if (candidate.weightKnown && candidate.stackWeightLb !== null) {
        knownContentsWeightLb += candidate.stackWeightLb
      } else if (isValidQuantity(candidate.quantity)) {
        unknownContentsCount += 1
      }
    }

    // Self-cycle: entry located inside itself.
    if (
      entry.location.kind === 'container' &&
      entry.location.containerInstanceId === entry.instanceId
    ) {
      cycleDetected = true
    }

    byContainer.set(entry.instanceId, {
      containerInstanceId: entry.instanceId,
      knownContentsWeightLb: roundTenths(knownContentsWeightLb),
      unknownContentsCount,
      knownSelfWeightLb: entry.stackWeightLb,
      selfWeightKnown: entry.weightKnown,
    })
  }

  return {
    entries: details,
    knownTotalLb: roundTenths(knownTotalLb),
    unknownEntryCount,
    isComplete: unknownEntryCount === 0,
    carriedDirectKnownLb: roundTenths(carriedDirectKnownLb),
    byContainer,
    invalidContainerRefs,
    cycleDetected,
  }
}

/**
 * Aggregate inventory weight from persisted entries + catalogue definitions.
 * Never mutates inputs. Safe for malformed locations and containment cycles.
 */
export function calculateInventoryWeight(
  entries: readonly InventoryWeightEntryInput[],
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>,
): InventoryWeightBreakdown {
  const details = entries.map((entry) =>
    calculateEntryWeight(entry, definitionsById),
  )
  return aggregateFromDetails(details)
}

/**
 * Convenience for enriched Overview / Inventory rows that already expose unit weight.
 */
export function calculateInventoryWeightFromEnriched(
  entries: readonly {
    instanceId: string
    itemId: string
    quantity: number
    location: InventoryLocation
    weightLb: number | null
    isContainer?: boolean
  }[],
  definitionsById?: ReadonlyMap<string, EquipmentItemDefinition>,
): InventoryWeightBreakdown {
  const details = entries.map((entry) => {
    const definition = definitionsById?.get(entry.itemId)
    const unitFromCatalog =
      definition !== undefined
        ? resolveUnitWeightLb(entry.itemId, definitionsById!)
        : null
    const unitWeightLb =
      unitFromCatalog !== null
        ? unitFromCatalog
        : entry.weightLb !== null && Number.isFinite(entry.weightLb)
          ? entry.weightLb
          : null
    const isContainer =
      entry.isContainer === true || isStorageContainer(definition)

    return toEntryDetail(entry, unitWeightLb, isContainer)
  })

  return aggregateFromDetails(details)
}

export function calculateCarryingCapacityLb(
  strengthScore: number,
  multiplier: number = SRD_2024_CARRYING_CAPACITY_MULTIPLIER,
): number {
  if (!Number.isFinite(strengthScore) || strengthScore < 0) {
    return 0
  }
  if (!Number.isFinite(multiplier) || multiplier < 0) {
    return 0
  }
  return roundTenths(strengthScore * multiplier)
}

export function calculateCarryingLoad(
  weight: Pick<
    InventoryWeightBreakdown,
    'knownTotalLb' | 'unknownEntryCount' | 'isComplete'
  >,
  strengthScore: number,
  options?: { capacityMultiplier?: number },
): CarryingLoadResult {
  const capacityLb = calculateCarryingCapacityLb(
    strengthScore,
    options?.capacityMultiplier ?? SRD_2024_CARRYING_CAPACITY_MULTIPLIER,
  )
  const knownWeightLb = weight.knownTotalLb
  const remainingLb = roundTenths(capacityLb - knownWeightLb)
  const percentUsed =
    capacityLb <= 0
      ? knownWeightLb > 0
        ? 100
        : 0
      : roundTenths((knownWeightLb / capacityLb) * 100)
  const overloaded = knownWeightLb > capacityLb
  const incompleteTotal = !weight.isComplete || weight.unknownEntryCount > 0

  let status: CarryingLoadStatus
  if (incompleteTotal) {
    status = overloaded
      ? 'incomplete-overloaded'
      : 'incomplete-under-capacity'
  } else if (overloaded) {
    status = 'overloaded'
  } else if (knownWeightLb === capacityLb) {
    status = 'at-capacity'
  } else {
    status = 'under-capacity'
  }

  return {
    strengthScore: Number.isFinite(strengthScore) ? strengthScore : 0,
    capacityLb,
    knownWeightLb,
    remainingLb,
    percentUsed,
    overloaded,
    incompleteTotal,
    status,
  }
}

export function formatEntryWeightDisplay(entry: EntryWeightDetail): {
  stackLabel: string
  unitLabel: string | null
} {
  if (!entry.weightKnown || entry.stackWeightLb === null) {
    return { stackLabel: '—', unitLabel: 'Unknown weight' }
  }

  const stackLabel = `${entry.stackWeightLb} lb`
  const unitLabel =
    entry.quantity === 1 || entry.unitWeightLb === null
      ? null
      : `${entry.unitWeightLb} lb each`

  return { stackLabel, unitLabel }
}

export function formatCarryingLoadSummary(
  load: CarryingLoadResult,
  unknownEntryCount: number,
): {
  primary: string
  detail: string | null
  statusLabel: string
  progressRatio: number
} {
  const weightPart = load.incompleteTotal
    ? `At least ${load.knownWeightLb} lb`
    : `${load.knownWeightLb} lb`
  const primary = `${weightPart} / ${load.capacityLb} lb`

  let detail: string | null = null
  if (unknownEntryCount > 0) {
    detail =
      unknownEntryCount === 1
        ? '1 item has unknown weight'
        : `${unknownEntryCount} items have unknown weight`
  }

  let statusLabel: string
  if (load.overloaded) {
    const over = roundTenths(load.knownWeightLb - load.capacityLb)
    statusLabel = load.incompleteTotal
      ? `At least ${over} lb over carrying capacity`
      : `${over} lb over carrying capacity`
  } else if (load.status === 'at-capacity') {
    statusLabel = 'At carrying capacity'
  } else {
    statusLabel = load.incompleteTotal
      ? `At least ${load.remainingLb} lb remaining`
      : `${load.remainingLb} lb remaining`
  }

  const progressRatio =
    load.capacityLb <= 0
      ? load.knownWeightLb > 0
        ? 1
        : 0
      : Math.min(load.knownWeightLb / load.capacityLb, 1)

  return {
    primary,
    detail,
    statusLabel,
    progressRatio,
  }
}

export function formatContainerTabWeight(
  knownContentsWeightLb: number,
  unknownContentsCount: number,
): string | null {
  if (knownContentsWeightLb <= 0 && unknownContentsCount === 0) {
    return null
  }
  if (unknownContentsCount > 0) {
    return knownContentsWeightLb > 0
      ? `≥${knownContentsWeightLb} lb`
      : 'weight unknown'
  }
  return `${knownContentsWeightLb} lb`
}

/** Map persisted inventory entries into weight calculation inputs. */
export function toWeightInputs(
  entries: readonly InventoryEntry[],
): InventoryWeightEntryInput[] {
  return entries.map((entry) => ({
    instanceId: entry.instanceId,
    itemId: entry.itemId,
    quantity: entry.quantity,
    location: entry.location,
  }))
}
