import { useEffect, useId, useMemo, useState } from 'react'
import type { AbilityScores, EditionId } from '../../domain/types'
import type {
  EquipmentItemDefinition,
  EquipmentLoadout,
  InventoryLocation,
} from '../../domain/equipment/types'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import { isCustomItemId } from '../../domain/equipment/customItems'
import {
  areInventoryStacksMergeCompatible,
  formatInventoryMutationError,
  type AddCatalogueInventoryItemInput,
  type AddCustomInventoryItemInput,
  type InventoryMutationResult,
} from '../../domain/equipment/inventoryMutations'
import {
  calculateInventoryWeightFromEnriched,
  formatContainerTabWeight,
  formatEntryWeightDisplay,
} from '../../domain/equipment/inventoryWeight'
import { formatLocationLabel } from '../../domain/equipment/inventory'
import { isItemEquipped } from '../../domain/equipment/equipmentLoadout'
import type { ResolvedInventoryEntry } from '../../rules/character/resolveCharacterEquipment'
import { formatGoldPieces } from './formatEquipment'
import { InventoryWeightSummary } from './InventoryWeightSummary'
import { AddInventoryItemPanel } from './AddInventoryItemPanel'

export type InventoryPageProps = {
  entries: readonly ResolvedInventoryEntry[]
  loadout: EquipmentLoadout
  goldPieces: number
  abilityScores: AbilityScores
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  editionId: EditionId
  equipmentCatalog: EquipmentCatalog
  seeded: boolean
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

type InventoryTab =
  | { kind: 'all'; id: 'all'; label: 'All' }
  | { kind: 'carried'; id: 'carried'; label: 'Carried' }
  | {
      kind: 'container'
      id: string
      label: string
      containerInstanceId: string
    }

type PendingRemove = {
  entry: ResolvedInventoryEntry
  isContainer: boolean
  contentCount: number
}

function formatCost(costGp: number | null, quantity: number): string {
  if (costGp === null) {
    return '—'
  }
  const total = costGp * quantity
  if (total >= 1) {
    return `${Math.round(total * 100) / 100} gp`
  }
  if (total >= 0.1) {
    return `${Math.round(total * 10)} sp`
  }
  return `${Math.round(total * 100)} cp`
}

function displayName(entry: ResolvedInventoryEntry): string {
  return entry.name.trim().length > 0 ? entry.name : entry.itemId
}

function matchesNameSearch(
  entry: ResolvedInventoryEntry,
  query: string,
): boolean {
  const trimmed = query.trim().toLowerCase()
  if (trimmed.length === 0) {
    return true
  }
  return displayName(entry).toLowerCase().includes(trimmed)
}

function buildTabs(
  entries: readonly ResolvedInventoryEntry[],
): InventoryTab[] {
  const containers = entries.filter((entry) => entry.isContainer)
  const seen = new Set<string>()
  const containerTabs: InventoryTab[] = []

  for (const container of containers) {
    if (seen.has(container.instanceId)) {
      continue
    }
    seen.add(container.instanceId)
    containerTabs.push({
      kind: 'container',
      id: container.instanceId,
      label: displayName(container),
      containerInstanceId: container.instanceId,
    })
  }

  containerTabs.sort((a, b) => a.label.localeCompare(b.label))

  return [
    { kind: 'all', id: 'all', label: 'All' },
    { kind: 'carried', id: 'carried', label: 'Carried' },
    ...containerTabs,
  ]
}

function countContents(
  entries: readonly ResolvedInventoryEntry[],
  containerInstanceId: string,
): number {
  return entries.filter(
    (entry) =>
      entry.location.kind === 'container' &&
      entry.location.containerInstanceId === containerInstanceId,
  ).length
}

export function InventoryPage({
  entries,
  loadout,
  goldPieces,
  abilityScores,
  definitionsById,
  editionId,
  equipmentCatalog,
  seeded,
  onSetQuantity,
  onAdjustQuantity,
  onRemove,
  onMove,
  onSplit,
  onMerge,
  onSetCurrency,
  onAdjustCurrency,
  onAddCatalogueItem,
  onAddCustomItem,
}: InventoryPageProps) {
  const headingId = useId()
  const [search, setSearch] = useState('')
  const [activeTabId, setActiveTabId] = useState('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)
  const [splitTargetId, setSplitTargetId] = useState<string | null>(null)
  const [splitAmount, setSplitAmount] = useState('1')
  const [currencyDraft, setCurrencyDraft] = useState(String(goldPieces))
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  )

  useEffect(() => {
    setCurrencyDraft(String(goldPieces))
  }, [goldPieces])

  const containerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of entries) {
      if (entry.isContainer) {
        map.set(entry.instanceId, displayName(entry))
      }
    }
    return map
  }, [entries])

  const tabs = useMemo(() => buildTabs(entries), [entries])
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0]

  const weightBreakdown = useMemo(
    () => calculateInventoryWeightFromEnriched(entries, definitionsById),
    [definitionsById, entries],
  )
  const weightByInstanceId = useMemo(() => {
    const map = new Map(
      weightBreakdown.entries.map((entry) => [entry.instanceId, entry] as const),
    )
    return map
  }, [weightBreakdown.entries])

  const containerOptions = useMemo(
    () =>
      entries
        .filter((entry) => entry.isContainer)
        .map((entry) => ({
          instanceId: entry.instanceId,
          name: displayName(entry),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [entries],
  )

  const visibleEntries = useMemo(() => {
    const searched = entries.filter((entry) => matchesNameSearch(entry, search))

    let filtered: ResolvedInventoryEntry[]
    if (activeTab === undefined || activeTab.kind === 'all') {
      filtered = searched
    } else if (activeTab.kind === 'carried') {
      filtered = searched.filter((entry) => entry.location.kind === 'carried')
    } else {
      filtered = searched.filter(
        (entry) =>
          entry.location.kind === 'container' &&
          entry.location.containerInstanceId === activeTab.containerInstanceId,
      )
    }

    return [...filtered].sort((a, b) => {
      const aEquipped = isItemEquipped(loadout, a.itemId) ? 0 : 1
      const bEquipped = isItemEquipped(loadout, b.itemId) ? 0 : 1
      if (aEquipped !== bEquipped) {
        return aEquipped - bEquipped
      }
      return displayName(a).localeCompare(displayName(b))
    })
  }, [activeTab, entries, loadout, search])

  const reportResult = (result: InventoryMutationResult) => {
    if (result.ok) {
      setActionError(null)
      return true
    }
    setActionError(formatInventoryMutationError(result.reason))
    return false
  }

  const containerDestinations = (forEntry: ResolvedInventoryEntry) =>
    entries.filter(
      (candidate) =>
        candidate.isContainer && candidate.instanceId !== forEntry.instanceId,
    )

  const mergeTargetsFor = (source: ResolvedInventoryEntry) =>
    entries.filter(
      (candidate) =>
        candidate.instanceId !== source.instanceId &&
        areInventoryStacksMergeCompatible(source, candidate, definitionsById),
    )

  const applyQuantityDraft = async (entry: ResolvedInventoryEntry) => {
    const raw = quantityDrafts[entry.instanceId] ?? String(entry.quantity)
    const parsed = Number(raw)
    if (!Number.isInteger(parsed) || parsed < 0) {
      setActionError('Enter a whole number quantity of 0 or more.')
      return
    }
    if (parsed === 0) {
      setPendingRemove({
        entry,
        isContainer: entry.isContainer,
        contentCount: countContents(entries, entry.instanceId),
      })
      return
    }
    const result = await onSetQuantity(entry.instanceId, parsed)
    if (reportResult(result)) {
      setQuantityDrafts((current) => {
        const next = { ...current }
        delete next[entry.instanceId]
        return next
      })
    }
  }

  const confirmRemove = async () => {
    if (pendingRemove === null) {
      return
    }
    const result = await onRemove(pendingRemove.entry.instanceId)
    if (reportResult(result)) {
      setPendingRemove(null)
    }
  }

  const applySplit = async (entry: ResolvedInventoryEntry) => {
    const parsed = Number(splitAmount)
    if (!Number.isInteger(parsed) || parsed < 1) {
      setActionError('Enter a whole number of 1 or more to split.')
      return
    }
    const result = await onSplit(entry.instanceId, parsed)
    if (reportResult(result)) {
      setSplitTargetId(null)
      setSplitAmount('1')
    }
  }

  const applyCurrency = async () => {
    const parsed = Number(currencyDraft)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setActionError('Enter a valid gold amount of zero or more.')
      return
    }
    const result = await onSetCurrency(parsed)
    reportResult(result)
  }

  return (
    <section className="inventory-page" aria-labelledby={headingId}>
      <h2 id={headingId}>Inventory</h2>
      <p className="inventory-page__intro">
        Manage what your character currently owns. Starting-equipment choices stay
        on the Equipment step.
      </p>

      {!seeded ? (
        <p className="inventory-page__banner" role="status">
          Inventory editing unlocks after starting equipment is complete and
          seeded. You can review a preview below; changes are not applied until
          then.
        </p>
      ) : null}

      {actionError !== null ? (
        <p className="inventory-page__error" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="inventory-page__stats">
        <InventoryWeightSummary
          entries={entries}
          abilityScores={abilityScores}
          definitionsById={definitionsById}
        />
        <fieldset className="inventory-page__currency" disabled={!seeded}>
          <legend>Currency (gp)</legend>
          <div className="inventory-page__currency-controls">
            <button
              type="button"
              aria-label="Decrease gold by 1"
              onClick={async () => {
                const result = await onAdjustCurrency(-1)
                if (reportResult(result) && result.ok) {
                  setCurrencyDraft(
                    String(result.equipment.inventory.currency.goldPieces),
                  )
                }
              }}
            >
              −
            </button>
            <label>
              <span className="visually-hidden">Gold pieces</span>
              <input
                data-inventory-currency="true"
                type="number"
                min={0}
                step={1}
                value={currencyDraft}
                onChange={(event) => setCurrencyDraft(event.target.value)}
                onBlur={() => {
                  void applyCurrency()
                }}
              />
            </label>
            <button
              type="button"
              aria-label="Increase gold by 1"
              onClick={async () => {
                const result = await onAdjustCurrency(1)
                if (reportResult(result) && result.ok) {
                  setCurrencyDraft(
                    String(result.equipment.inventory.currency.goldPieces),
                  )
                }
              }}
            >
              +
            </button>
            <button type="button" onClick={() => void applyCurrency()}>
              Set
            </button>
            <span className="inventory-page__currency-readout" aria-live="polite">
              {formatGoldPieces(goldPieces)}
            </span>
          </div>
        </fieldset>
      </div>

      <AddInventoryItemPanel
        editionId={editionId}
        equipmentCatalog={equipmentCatalog}
        definitionsById={definitionsById}
        containerOptions={containerOptions}
        disabled={!seeded}
        onAddCatalogue={onAddCatalogueItem}
        onAddCustom={onAddCustomItem}
      />

      {entries.length === 0 ? (
        <p className="inventory-page__empty" role="status">
          {seeded
            ? 'No items in inventory yet.'
            : 'No inventory items to show yet. Complete starting equipment on the Equipment step.'}
        </p>
      ) : (
        <>
          <label className="inventory-page__search">
            <span className="visually-hidden">Search inventory by name</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name..."
            />
          </label>

          <div
            className="inventory-page__tabs"
            role="tablist"
            aria-label="Inventory locations"
          >
            {tabs.map((tab) => {
              const containerWeight =
                tab.kind === 'container'
                  ? weightBreakdown.byContainer.get(tab.containerInstanceId)
                  : undefined
              const weightSuffix =
                containerWeight !== undefined
                  ? formatContainerTabWeight(
                      containerWeight.knownContentsWeightLb,
                      containerWeight.unknownContentsCount,
                    )
                  : null
              const tabLabel =
                weightSuffix !== null ? `${tab.label} · ${weightSuffix}` : tab.label

              return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={tab.id === activeTab?.id}
                title={
                  weightSuffix !== null
                    ? `${tab.label} contents ${weightSuffix}`
                    : tab.label
                }
                className={
                  tab.id === activeTab?.id
                    ? 'inventory-page__tab inventory-page__tab--active'
                    : 'inventory-page__tab'
                }
                onClick={() => setActiveTabId(tab.id)}
              >
                {tabLabel}
              </button>
              )
            })}
          </div>

          <div className="inventory-page__table-wrap" role="tabpanel">
            <table className="inventory-page__table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Location</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="inventory-page__empty-row">
                      No items match this filter.
                    </td>
                  </tr>
                ) : (
                  visibleEntries.map((entry) => {
                    const equipped = isItemEquipped(loadout, entry.itemId)
                    const locationLabel =
                      entry.location.kind === 'carried'
                        ? 'Carried'
                        : formatLocationLabel(
                            entry.location,
                            containerNameById,
                          )
                    const qtyValue =
                      quantityDrafts[entry.instanceId] ?? String(entry.quantity)
                    const destinations = containerDestinations(entry)
                    const mergeTargets = mergeTargetsFor(entry)
                    const unknownCatalogue =
                      !definitionsById.has(entry.itemId) &&
                      !isCustomItemId(entry.itemId)
                    const isCustom = isCustomItemId(entry.itemId)
                    const weightDetail = weightByInstanceId.get(entry.instanceId)
                    const weightDisplay =
                      weightDetail !== undefined
                        ? formatEntryWeightDisplay(weightDetail)
                        : { stackLabel: '—', unitLabel: 'Unknown weight' as string | null }

                    return (
                      <tr
                        key={entry.instanceId}
                        className={
                          equipped
                            ? 'inventory-page__row inventory-page__row--equipped'
                            : 'inventory-page__row'
                        }
                      >
                        <td>
                          <div className="inventory-page__item-cell">
                            <span className="inventory-page__item-name">
                              {displayName(entry)}
                            </span>
                            <span className="inventory-page__item-meta">
                              {entry.category}
                              {isCustom ? ' · Custom item' : ''}
                              {unknownCatalogue
                                ? ' · Unknown catalogue item'
                                : ''}
                            </span>
                            {equipped ? (
                              <span className="inventory-page__equipped-badge">
                                Equipped
                                <span className="visually-hidden">
                                  {' '}
                                  (shared by identical item types until
                                  instance-aware loadout)
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="inventory-page__qty">
                            <button
                              type="button"
                              aria-label={`Decrease ${displayName(entry)} quantity`}
                              disabled={!seeded}
                              onClick={async () => {
                                if (entry.quantity <= 1) {
                                  setPendingRemove({
                                    entry,
                                    isContainer: entry.isContainer,
                                    contentCount: countContents(
                                      entries,
                                      entry.instanceId,
                                    ),
                                  })
                                  return
                                }
                                reportResult(
                                  await onAdjustQuantity(entry.instanceId, -1),
                                )
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              aria-label={`${displayName(entry)} quantity`}
                              disabled={!seeded}
                              value={qtyValue}
                              onChange={(event) =>
                                setQuantityDrafts((current) => ({
                                  ...current,
                                  [entry.instanceId]: event.target.value,
                                }))
                              }
                              onBlur={() => {
                                void applyQuantityDraft(entry)
                              }}
                            />
                            <button
                              type="button"
                              aria-label={`Increase ${displayName(entry)} quantity`}
                              disabled={!seeded}
                              onClick={async () => {
                                reportResult(
                                  await onAdjustQuantity(entry.instanceId, 1),
                                )
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{locationLabel}</td>
                        <td>
                          <div className="inventory-page__weight-cell">
                            <span>{weightDisplay.stackLabel}</span>
                            {weightDisplay.unitLabel !== null ? (
                              <span className="inventory-page__item-meta">
                                {weightDisplay.unitLabel}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{formatCost(entry.costGp, entry.quantity)}</td>
                        <td>
                          <div className="inventory-page__actions">
                            <label className="inventory-page__move">
                              <span className="visually-hidden">
                                Move {displayName(entry)}
                              </span>
                              <select
                                disabled={!seeded}
                                aria-label={`Move ${displayName(entry)}`}
                                value={
                                  entry.location.kind === 'carried'
                                    ? 'carried'
                                    : entry.location.containerInstanceId
                                }
                                onChange={async (event) => {
                                  const value = event.target.value
                                  const location: InventoryLocation =
                                    value === 'carried'
                                      ? { kind: 'carried' }
                                      : {
                                          kind: 'container',
                                          containerInstanceId: value,
                                        }
                                  reportResult(
                                    await onMove(entry.instanceId, location),
                                  )
                                }}
                              >
                                <option value="carried">Carried</option>
                                {destinations.map((container) => (
                                  <option
                                    key={container.instanceId}
                                    value={container.instanceId}
                                  >
                                    {displayName(container)}
                                  </option>
                                ))}
                              </select>
                            </label>

                            {entry.quantity > 1 ? (
                              <button
                                type="button"
                                disabled={!seeded}
                                onClick={() => {
                                  setSplitTargetId(entry.instanceId)
                                  setSplitAmount('1')
                                }}
                              >
                                Split
                              </button>
                            ) : null}

                            {mergeTargets.length > 0 ? (
                              <label className="inventory-page__merge">
                                <span className="visually-hidden">
                                  Merge {displayName(entry)} into
                                </span>
                                <select
                                  disabled={!seeded}
                                  defaultValue=""
                                  aria-label={`Merge ${displayName(entry)} into`}
                                  onChange={async (event) => {
                                    const targetId = event.target.value
                                    event.target.value = ''
                                    if (targetId.length === 0) {
                                      return
                                    }
                                    reportResult(
                                      await onMerge(targetId, entry.instanceId),
                                    )
                                  }}
                                >
                                  <option value="" disabled>
                                    Merge into…
                                  </option>
                                  {mergeTargets.map((target) => (
                                    <option
                                      key={target.instanceId}
                                      value={target.instanceId}
                                    >
                                      {displayName(target)} (×{target.quantity})
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}

                            <button
                              type="button"
                              className="inventory-page__remove"
                              disabled={!seeded}
                              onClick={() =>
                                setPendingRemove({
                                  entry,
                                  isContainer: entry.isContainer,
                                  contentCount: countContents(
                                    entries,
                                    entry.instanceId,
                                  ),
                                })
                              }
                            >
                              Remove
                            </button>
                          </div>

                          {splitTargetId === entry.instanceId ? (
                            <div className="inventory-page__split-form">
                              <label>
                                Split quantity
                                <input
                                  type="number"
                                  min={1}
                                  max={entry.quantity - 1}
                                  value={splitAmount}
                                  onChange={(event) =>
                                    setSplitAmount(event.target.value)
                                  }
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => void applySplit(entry)}
                              >
                                Confirm split
                              </button>
                              <button
                                type="button"
                                onClick={() => setSplitTargetId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pendingRemove !== null ? (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="inventory-remove-title"
            aria-describedby="inventory-remove-message"
          >
            <h2 id="inventory-remove-title">Remove from inventory?</h2>
            <p id="inventory-remove-message">
              Remove {pendingRemove.entry.quantity}×{' '}
              {displayName(pendingRemove.entry)}
              {pendingRemove.entry.location.kind === 'container'
                ? ` from ${
                    containerNameById.get(
                      pendingRemove.entry.location.containerInstanceId,
                    ) ?? 'its container'
                  }`
                : ''}
              ?
              {pendingRemove.isContainer
                ? ` This container holds ${pendingRemove.contentCount} item${
                    pendingRemove.contentCount === 1 ? '' : 's'
                  }. Those contents will be moved to carried inventory.`
                : ''}
            </p>
            <div className="dialog__actions">
              <button type="button" onClick={() => setPendingRemove(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="dialog__action--primary"
                onClick={() => void confirmRemove()}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
