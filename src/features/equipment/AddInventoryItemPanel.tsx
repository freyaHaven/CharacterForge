import { useEffect, useId, useMemo, useState } from 'react'
import type { EditionId } from '../../domain/types'
import type {
  EquipmentItemCategory,
  EquipmentItemDefinition,
  InventoryLocation,
} from '../../domain/equipment/types'
import type { EquipmentCatalog } from '../../domain/ports/equipmentCatalog'
import {
  formatInventoryMutationError,
  type AddCatalogueInventoryItemInput,
  type AddCustomInventoryItemInput,
  type InventoryMutationResult,
  type InventoryStackMergeMode,
} from '../../domain/equipment/inventoryMutations'
import { formatGoldPieces } from './formatEquipment'

export type AddInventoryItemPanelProps = {
  editionId: EditionId
  equipmentCatalog: EquipmentCatalog
  definitionsById: ReadonlyMap<string, EquipmentItemDefinition>
  containerOptions: readonly { instanceId: string; name: string }[]
  disabled?: boolean
  onAddCatalogue: (
    input: AddCatalogueInventoryItemInput,
  ) => Promise<InventoryMutationResult>
  onAddCustom: (
    input: AddCustomInventoryItemInput,
  ) => Promise<InventoryMutationResult>
}

type AddMode = 'catalogue' | 'custom'

const CATEGORY_OPTIONS: readonly EquipmentItemCategory[] = [
  'gear',
  'weapon',
  'armor',
  'shield',
  'ammunition',
  'tool',
  'container',
]

function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }
  return parsed
}

function parseOptionalNonNegative(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return undefined
  }
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }
  return parsed
}

function locationFromSelect(value: string): InventoryLocation {
  if (value === 'carried') {
    return { kind: 'carried' }
  }
  return { kind: 'container', containerInstanceId: value }
}

export function AddInventoryItemPanel({
  editionId,
  equipmentCatalog,
  definitionsById,
  containerOptions,
  disabled = false,
  onAddCatalogue,
  onAddCustom,
}: AddInventoryItemPanelProps) {
  const headingId = useId()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AddMode>('catalogue')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [catalogueItems, setCatalogueItems] = useState<
    EquipmentItemDefinition[]
  >([])
  const [catalogueLoading, setCatalogueLoading] = useState(false)
  const [catalogueSearch, setCatalogueSearch] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [catalogueQty, setCatalogueQty] = useState('1')
  const [catalogueDestination, setCatalogueDestination] = useState('carried')
  const [mergeMode, setMergeMode] =
    useState<InventoryStackMergeMode>('always-new')

  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState('1')
  const [customNotes, setCustomNotes] = useState('')
  const [customWeight, setCustomWeight] = useState('')
  const [customCost, setCustomCost] = useState('')
  const [customCategory, setCustomCategory] =
    useState<EquipmentItemCategory>('gear')
  const [customDestination, setCustomDestination] = useState('carried')

  useEffect(() => {
    if (!open || mode !== 'catalogue') {
      return
    }

    let active = true
    setCatalogueLoading(true)
    void equipmentCatalog.listEquipment(editionId).then((items) => {
      if (!active) {
        return
      }
      const usable = items
        .filter((item) => item.category !== 'currency')
        .filter((item) => item.expandsTo === undefined)
        .sort((a, b) => a.name.localeCompare(b.name))
      setCatalogueItems(usable)
      setCatalogueLoading(false)
    })

    return () => {
      active = false
    }
  }, [editionId, equipmentCatalog, mode, open])

  const filteredCatalogue = useMemo(() => {
    const query = catalogueSearch.trim().toLowerCase()
    if (query.length === 0) {
      return catalogueItems
    }
    return catalogueItems.filter((item) => {
      const haystack = [item.name, item.category, ...(item.tags ?? [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [catalogueItems, catalogueSearch])

  const selectedDefinition =
    selectedItemId === null
      ? undefined
      : (definitionsById.get(selectedItemId) ??
        catalogueItems.find((item) => item.id === selectedItemId))

  const resetForms = () => {
    setError(null)
    setCatalogueSearch('')
    setSelectedItemId(null)
    setCatalogueQty('1')
    setCatalogueDestination('carried')
    setMergeMode('always-new')
    setCustomName('')
    setCustomQty('1')
    setCustomNotes('')
    setCustomWeight('')
    setCustomCost('')
    setCustomCategory('gear')
    setCustomDestination('carried')
  }

  const destinationOptions = (
    <>
      <option value="carried">Carried</option>
      {containerOptions.map((container) => (
        <option key={container.instanceId} value={container.instanceId}>
          {container.name}
        </option>
      ))}
    </>
  )

  const submitCatalogue = async () => {
    setError(null)
    if (selectedItemId === null) {
      setError('Select a catalogue item to add.')
      return
    }
    const quantity = parsePositiveInteger(catalogueQty)
    if (quantity === null) {
      setError('Enter a whole number quantity of 1 or more.')
      return
    }

    setBusy(true)
    const result = await onAddCatalogue({
      itemId: selectedItemId,
      quantity,
      location: locationFromSelect(catalogueDestination),
      mergeMode,
    })
    setBusy(false)

    if (!result.ok) {
      setError(formatInventoryMutationError(result.reason))
      return
    }

    resetForms()
    setOpen(false)
  }

  const submitCustom = async () => {
    setError(null)
    if (customName.trim().length === 0) {
      setError('Enter a name for the custom item.')
      return
    }
    const quantity = parsePositiveInteger(customQty)
    if (quantity === null) {
      setError('Enter a whole number quantity of 1 or more.')
      return
    }
    const weightLb = parseOptionalNonNegative(customWeight)
    if (weightLb === null) {
      setError('Weight must be zero or a positive number when provided.')
      return
    }
    const costGp = parseOptionalNonNegative(customCost)
    if (costGp === null) {
      setError('Cost must be zero or a positive number when provided.')
      return
    }

    setBusy(true)
    const result = await onAddCustom({
      name: customName,
      quantity,
      location: locationFromSelect(customDestination),
      notes: customNotes,
      weightLb,
      costGp,
      category: customCategory,
    })
    setBusy(false)

    if (!result.ok) {
      setError(formatInventoryMutationError(result.reason))
      return
    }

    resetForms()
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="inventory-add">
        <button
          type="button"
          className="inventory-add__open"
          disabled={disabled}
          onClick={() => {
            resetForms()
            setOpen(true)
          }}
        >
          Add Item
        </button>
      </div>
    )
  }

  return (
    <section
      className="inventory-add inventory-add--open"
      aria-labelledby={headingId}
    >
      <div className="inventory-add__header">
        <h3 id={headingId}>Add Item</h3>
        <button
          type="button"
          onClick={() => {
            resetForms()
            setOpen(false)
          }}
        >
          Close
        </button>
      </div>

      <div className="inventory-add__modes" role="tablist" aria-label="Add item mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'catalogue'}
          className={
            mode === 'catalogue'
              ? 'inventory-add__mode inventory-add__mode--active'
              : 'inventory-add__mode'
          }
          onClick={() => {
            setMode('catalogue')
            setError(null)
          }}
        >
          Browse Catalogue
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'custom'}
          className={
            mode === 'custom'
              ? 'inventory-add__mode inventory-add__mode--active'
              : 'inventory-add__mode'
          }
          onClick={() => {
            setMode('custom')
            setError(null)
          }}
        >
          Create Custom Item
        </button>
      </div>

      {error !== null ? (
        <p className="inventory-add__error" role="alert">
          {error}
        </p>
      ) : null}

      {mode === 'catalogue' ? (
        <div className="inventory-add__panel" role="tabpanel">
          <label className="inventory-add__field">
            <span>Search catalogue</span>
            <input
              type="search"
              value={catalogueSearch}
              onChange={(event) => setCatalogueSearch(event.target.value)}
              placeholder="Search by name or tag..."
              disabled={disabled || busy}
            />
          </label>

          {catalogueLoading ? (
            <p role="status">Loading catalogue…</p>
          ) : (
            <div
              className="inventory-add__catalogue-list"
              role="listbox"
              aria-label="Catalogue items"
            >
              {filteredCatalogue.length === 0 ? (
                <p role="status">No catalogue items match this search.</p>
              ) : (
                filteredCatalogue.map((item) => {
                  const selected = item.id === selectedItemId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={
                        selected
                          ? 'inventory-add__catalogue-option inventory-add__catalogue-option--selected'
                          : 'inventory-add__catalogue-option'
                      }
                      onClick={() => setSelectedItemId(item.id)}
                      disabled={disabled || busy}
                    >
                      <span className="inventory-add__catalogue-name">
                        {item.name}
                      </span>
                      <span className="inventory-add__catalogue-meta">
                        {item.category}
                        {item.weightLb !== undefined
                          ? ` · ${item.weightLb} lb`
                          : ' · weight unknown'}
                        {item.costGp !== undefined
                          ? ` · ${formatGoldPieces(item.costGp)}`
                          : ''}
                      </span>
                      {item.notes !== undefined && item.notes.trim().length > 0 ? (
                        <span className="inventory-add__catalogue-notes">
                          {item.notes}
                        </span>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          )}

          {selectedDefinition !== undefined ? (
            <p className="inventory-add__selection" role="status">
              Selected: {selectedDefinition.name}
            </p>
          ) : null}

          <div className="inventory-add__row">
            <label className="inventory-add__field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={catalogueQty}
                onChange={(event) => setCatalogueQty(event.target.value)}
                disabled={disabled || busy}
              />
            </label>
            <label className="inventory-add__field">
              <span>Destination</span>
              <select
                value={catalogueDestination}
                onChange={(event) =>
                  setCatalogueDestination(event.target.value)
                }
                disabled={disabled || busy}
              >
                {destinationOptions}
              </select>
            </label>
          </div>

          <fieldset className="inventory-add__fieldset" disabled={disabled || busy}>
            <legend>Stacking</legend>
            <label className="inventory-add__radio">
              <input
                type="radio"
                name="catalogue-merge"
                checked={mergeMode === 'always-new'}
                onChange={() => setMergeMode('always-new')}
              />
              Add as a new stack
            </label>
            <label className="inventory-add__radio">
              <input
                type="radio"
                name="catalogue-merge"
                checked={mergeMode === 'merge-if-compatible'}
                onChange={() => setMergeMode('merge-if-compatible')}
              />
              Merge into an existing compatible stack when possible
            </label>
          </fieldset>

          <button
            type="button"
            className="inventory-add__submit"
            disabled={disabled || busy || selectedItemId === null}
            onClick={() => {
              void submitCatalogue()
            }}
          >
            Add from Catalogue
          </button>
        </div>
      ) : (
        <div className="inventory-add__panel" role="tabpanel">
          <label className="inventory-add__field">
            <span>Name</span>
            <input
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              disabled={disabled || busy}
              required
              aria-required="true"
            />
          </label>

          <div className="inventory-add__row">
            <label className="inventory-add__field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                step={1}
                value={customQty}
                onChange={(event) => setCustomQty(event.target.value)}
                disabled={disabled || busy}
              />
            </label>
            <label className="inventory-add__field">
              <span>Category</span>
              <select
                value={customCategory}
                onChange={(event) =>
                  setCustomCategory(event.target.value as EquipmentItemCategory)
                }
                disabled={disabled || busy}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="inventory-add__row">
            <label className="inventory-add__field">
              <span>Unit weight (lb, optional)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={customWeight}
                onChange={(event) => setCustomWeight(event.target.value)}
                disabled={disabled || busy}
              />
            </label>
            <label className="inventory-add__field">
              <span>Unit cost (gp, optional)</span>
              <input
                type="number"
                min={0}
                step="any"
                value={customCost}
                onChange={(event) => setCustomCost(event.target.value)}
                disabled={disabled || busy}
              />
            </label>
          </div>

          <label className="inventory-add__field">
            <span>Notes (optional)</span>
            <textarea
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
              rows={3}
              disabled={disabled || busy}
            />
          </label>

          <label className="inventory-add__field">
            <span>Destination</span>
            <select
              value={customDestination}
              onChange={(event) => setCustomDestination(event.target.value)}
              disabled={disabled || busy}
            >
              {destinationOptions}
            </select>
          </label>

          <p className="inventory-add__hint">
            Custom items are never equippable and do not merge with other customs
            that merely share a name. Leave weight blank if unknown.
          </p>

          <button
            type="button"
            className="inventory-add__submit"
            disabled={disabled || busy}
            onClick={() => {
              void submitCustom()
            }}
          >
            Create Custom Item
          </button>
        </div>
      )}
    </section>
  )
}
