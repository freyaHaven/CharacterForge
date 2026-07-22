import { useMemo, useState } from 'react'
import type { AbilityScores } from '../../domain/types'
import type {
  EquipmentItemDefinition,
  EquipmentLoadout,
} from '../../domain/equipment/types'
import {
  isItemEquipped,
  previewEquipItem,
  previewSetVersatileGrip,
  previewUnequipItem,
  type EquipPreview,
} from '../../domain/equipment/equipmentLoadout'
import {
  calculateInventoryWeightFromEnriched,
  formatContainerTabWeight,
  formatEntryWeightDisplay,
} from '../../domain/equipment/inventoryWeight'
import { formatLocationLabel } from '../../domain/equipment/inventory'
import type { ResolvedInventoryEntry } from '../../rules/character/resolveCharacterEquipment'
import { formatGoldPieces } from './formatEquipment'
import { isEquippableItem } from './isEquippableItem'
import { InventoryWeightSummary } from './InventoryWeightSummary'

export type InventoryPanelProps = {
  entries: readonly ResolvedInventoryEntry[]
  loadout: EquipmentLoadout
  goldPieces: number
  abilityScores: AbilityScores
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  onChangeLoadout: (next: EquipmentLoadout) => void
}

type InventoryTab =
  | { kind: 'all'; id: 'all'; label: 'All' }
  | { kind: 'equipment'; id: 'equipment'; label: 'Equipment' }
  | {
      kind: 'container'
      id: string
      label: string
      containerInstanceId: string
    }

function formatCost(costGp: number | null, quantity: number): string {
  if (costGp === null) {
    return '—'
  }

  const total = costGp * quantity
  if (total >= 1) {
    const rounded = Math.round(total * 100) / 100
    return `${rounded} gp`
  }

  if (total >= 0.1) {
    return `${Math.round(total * 10)} sp`
  }

  return `${Math.round(total * 100)} cp`
}

function entryNotes(
  entry: ResolvedInventoryEntry,
  containerNameById: ReadonlyMap<string, string>,
): string {
  if (entry.location.kind === 'container') {
    return formatLocationLabel(entry.location, containerNameById)
  }

  return entry.notes
}

function matchesSearch(
  entry: ResolvedInventoryEntry,
  query: string,
  containerName: string | null,
): boolean {
  if (query.trim().length === 0) {
    return true
  }

  const haystack = [
    entry.name,
    entry.category,
    entry.notes,
    ...entry.tags,
    containerName ?? '',
    entry.location.kind === 'carried' ? 'carried equipment' : '',
  ]
    .join(' ')
    .toLowerCase()

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .every((part) => haystack.includes(part))
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
      label: container.name,
      containerInstanceId: container.instanceId,
    })
  }

  containerTabs.sort((a, b) => a.label.localeCompare(b.label))

  return [
    { kind: 'all', id: 'all', label: 'All' },
    { kind: 'equipment', id: 'equipment', label: 'Equipment' },
    ...containerTabs,
  ]
}

export function InventoryPanel({
  entries,
  loadout,
  goldPieces,
  abilityScores,
  definitionsById,
  onChangeLoadout,
}: InventoryPanelProps) {
  const [search, setSearch] = useState('')
  const [activeTabId, setActiveTabId] = useState<string>('all')
  const [pendingEquip, setPendingEquip] = useState<{
    itemId: string
    preview: EquipPreview
  } | null>(null)

  const containerNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of entries) {
      if (entry.isContainer) {
        map.set(entry.instanceId, entry.name)
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
  const weightByInstanceId = useMemo(
    () =>
      new Map(
        weightBreakdown.entries.map(
          (entry) => [entry.instanceId, entry] as const,
        ),
      ),
    [weightBreakdown.entries],
  )

  const mainHandDefinition =
    loadout.mainHandItemId === null
      ? undefined
      : definitionsById.get(loadout.mainHandItemId)
  const mainHandIsVersatile = mainHandDefinition?.handUsage === 'versatile'

  const visibleEntries = useMemo(() => {
    const searched = entries.filter((entry) =>
      matchesSearch(
        entry,
        search,
        entry.location.kind === 'container'
          ? (containerNameById.get(entry.location.containerInstanceId) ?? null)
          : null,
      ),
    )

    let filtered: ResolvedInventoryEntry[]
    if (activeTab === undefined || activeTab.kind === 'all') {
      filtered = searched
    } else if (activeTab.kind === 'equipment') {
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
      return a.name.localeCompare(b.name)
    })
  }, [activeTab, containerNameById, entries, loadout, search])

  const requestEquip = (itemId: string) => {
    const preview = previewEquipItem(loadout, itemId, definitionsById)
    if (preview.hasConflict) {
      setPendingEquip({ itemId, preview })
      return
    }
    onChangeLoadout(preview.nextLoadout)
  }

  const requestUnequip = (itemId: string) => {
    onChangeLoadout(previewUnequipItem(loadout, itemId))
  }

  const requestGripChange = (grip: 'one-handed' | 'two-handed') => {
    if (loadout.mainHandGrip === grip) {
      return
    }
    const preview = previewSetVersatileGrip(loadout, grip, definitionsById)
    if (preview.hasConflict) {
      setPendingEquip({
        itemId: loadout.mainHandItemId ?? '',
        preview,
      })
      return
    }
    onChangeLoadout(preview.nextLoadout)
  }

  const confirmPendingEquip = () => {
    if (pendingEquip === null) {
      return
    }
    onChangeLoadout(pendingEquip.preview.nextLoadout)
    setPendingEquip(null)
  }

  if (entries.length === 0 && goldPieces <= 0) {
    return null
  }

  return (
    <div className="inventory-panel">
      <div className="inventory-panel__stats">
        <InventoryWeightSummary
          entries={entries}
          abilityScores={abilityScores}
          definitionsById={definitionsById}
          compact
        />
        {goldPieces > 0 ? (
          <p className="inventory-panel__currency">{formatGoldPieces(goldPieces)}</p>
        ) : null}
      </div>

      {entries.length > 0 ? (
        <>
          <label className="inventory-panel__search">
            <span className="visually-hidden">Search items</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search items..."
            />
          </label>

          <div
            className="inventory-panel__tabs"
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
                weightSuffix !== null
                  ? `${tab.label} · ${weightSuffix}`
                  : tab.label

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
                      ? 'inventory-panel__tab inventory-panel__tab--active'
                      : 'inventory-panel__tab'
                  }
                  onClick={() => setActiveTabId(tab.id)}
                >
                  {tabLabel}
                </button>
              )
            })}
          </div>

          <div className="inventory-panel__table-wrap" role="tabpanel">
            <table className="inventory-panel__table">
              <thead>
                <tr>
                  <th scope="col">Equipped</th>
                  <th scope="col">Name</th>
                  <th scope="col">Weight</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Cost</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="inventory-panel__empty">
                      No items match this filter.
                    </td>
                  </tr>
                ) : (
                  visibleEntries.map((entry) => {
                    const definition = definitionsById.get(entry.itemId)
                    const equippable = isEquippableItem(definition)
                    const equipped = isItemEquipped(loadout, entry.itemId)
                    const notes = entryNotes(entry, containerNameById)
                    const weightDetail = weightByInstanceId.get(entry.instanceId)
                    const weightDisplay =
                      weightDetail !== undefined
                        ? formatEntryWeightDisplay(weightDetail)
                        : {
                            stackLabel: '—',
                            unitLabel: 'Unknown weight' as string | null,
                          }

                    return (
                      <tr
                        key={entry.instanceId}
                        className={
                          equipped
                            ? 'inventory-panel__row inventory-panel__row--active'
                            : 'inventory-panel__row'
                        }
                      >
                        <td className="inventory-panel__equipped">
                          <input
                            type="checkbox"
                            checked={equipped}
                            disabled={!equippable}
                            aria-label={`Equip ${entry.name}`}
                            onChange={(event) => {
                              if (event.target.checked) {
                                requestEquip(entry.itemId)
                              } else {
                                requestUnequip(entry.itemId)
                              }
                            }}
                          />
                        </td>
                        <td className="inventory-panel__name">
                          <span className="inventory-panel__name-text">
                            {entry.name}
                          </span>
                          {equipped ? (
                            <span className="inventory-panel__equipped-badge">
                              Equipped
                            </span>
                          ) : null}
                          <span className="inventory-panel__meta">
                            {weightDisplay.stackLabel}
                            {weightDisplay.unitLabel !== null
                              ? ` · ${weightDisplay.unitLabel}`
                              : ''}
                            {' · Qty '}
                            {entry.quantity}
                            {' · '}
                            {formatCost(entry.costGp, entry.quantity)}
                          </span>
                          {notes.trim().length > 0 ? (
                            <span className="inventory-panel__meta-notes">
                              {notes}
                            </span>
                          ) : null}
                        </td>
                        <td className="inventory-panel__col-secondary">
                          <div className="inventory-panel__weight-cell">
                            <span>{weightDisplay.stackLabel}</span>
                            {weightDisplay.unitLabel !== null ? (
                              <span className="inventory-panel__meta">
                                {weightDisplay.unitLabel}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="inventory-panel__col-secondary">
                          {entry.quantity}
                        </td>
                        <td className="inventory-panel__col-secondary">
                          {formatCost(entry.costGp, entry.quantity)}
                        </td>
                        <td className="inventory-panel__col-secondary">
                          {notes}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {mainHandIsVersatile ? (
            <fieldset className="inventory-panel__grip">
              <legend className="inventory-panel__grip-legend">
                {mainHandDefinition?.name ?? 'Weapon'} grip
              </legend>
              <label className="inventory-panel__grip-option">
                <input
                  type="radio"
                  name="inventory-main-hand-grip"
                  checked={loadout.mainHandGrip !== 'two-handed'}
                  onChange={() => requestGripChange('one-handed')}
                />
                One-handed
              </label>
              <label className="inventory-panel__grip-option">
                <input
                  type="radio"
                  name="inventory-main-hand-grip"
                  checked={loadout.mainHandGrip === 'two-handed'}
                  onChange={() => requestGripChange('two-handed')}
                />
                Two-handed
              </label>
            </fieldset>
          ) : null}
        </>
      ) : null}

      {pendingEquip !== null ? (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="inventory-equip-confirm-title"
            aria-describedby="inventory-equip-confirm-message"
          >
            <h2 id="inventory-equip-confirm-title">Replace equipped item?</h2>
            <p id="inventory-equip-confirm-message">
              {pendingEquip.preview.message}
            </p>
            <div className="dialog__actions">
              <button type="button" onClick={() => setPendingEquip(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="dialog__action--primary"
                onClick={confirmPendingEquip}
              >
                Equip{' '}
                {definitionsById.get(pendingEquip.itemId)?.name ??
                  pendingEquip.itemId}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
