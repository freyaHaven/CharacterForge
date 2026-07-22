import { useId } from 'react'
import { ChoiceAccordion } from '../choices/ChoiceAccordion'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import type {
  EquipmentItemDefinition,
  EquipmentSelection,
} from '../../domain/equipment/types'
import {
  chooseItemsBounds,
  formatEquipmentOptionPreview,
  itemMatchesEquipmentFilter,
} from '../../domain/equipment/equipmentChoiceTree'
import type {
  ResolvedEquipmentEntitlement,
  ResolvedEquipmentSource,
  ResolvedInventoryItem,
} from '../../rules/character/resolveCharacterEquipment'
import {
  upsertEquipmentItemChoices,
  upsertEquipmentOptionSelection,
} from '../../rules/equipment/pruneInactiveEquipmentSelections'
import { EquipmentSourceBadge } from './EquipmentSourceBadge'
import { formatGoldPieces, formatInventoryLine } from './formatEquipment'

type EquipmentSourceSectionProps = {
  source: ResolvedEquipmentSource
  selections: EquipmentSelection[]
  catalogueItems: readonly EquipmentItemDefinition[]
  onChangeSelections: (next: EquipmentSelection[]) => void
}

function ChooseItemsEditor({
  source,
  entitlement,
  selections,
  catalogueItems,
  onChangeSelections,
  nested,
}: {
  source: ResolvedEquipmentSource
  entitlement: ResolvedEquipmentEntitlement
  selections: EquipmentSelection[]
  catalogueItems: readonly EquipmentItemDefinition[]
  onChangeSelections: (next: EquipmentSelection[]) => void
  nested: boolean
}) {
  const definition = entitlement.entitlement
  if (definition.type !== 'choose-items') {
    return null
  }

  const eligible = catalogueItems
    .filter((item) => itemMatchesEquipmentFilter(item, definition.catalogueFilter))
    .sort((a, b) => a.name.localeCompare(b.name))

  const { min, max } = chooseItemsBounds(definition)
  const selectedIds = new Set(
    (entitlement.selection?.choices ?? []).map((choice) => choice.itemId),
  )
  const legendId = useId()
  const controlId = `${source.source.kind}-${entitlement.path.join('-')}-${definition.id}`

  const setChoices = (itemIds: string[]) => {
    onChangeSelections(
      upsertEquipmentItemChoices(
        selections,
        source.source,
        definition.id,
        itemIds.map((itemId) => ({ itemId, quantity: 1 })),
        entitlement.path,
      ),
    )
  }

  const singleSelect = min === 1 && max === 1

  return (
    <fieldset
      className={
        nested
          ? 'equipment-source-card__choice equipment-source-card__choice--nested'
          : 'equipment-source-card__choice'
      }
      aria-labelledby={legendId}
    >
      <legend id={legendId} className="equipment-source-card__choice-title">
        {definition.label}
        {min === max ? ` (${min})` : ` (${min}–${max})`}
      </legend>

      {eligible.length === 0 ? (
        <p className="equipment-source-card__note">
          No catalogue items match this choice yet.
        </p>
      ) : singleSelect ? (
        <SingleSelectCardGrid
          id={controlId}
          name={controlId}
          options={eligible.map((item) => ({
            id: item.id,
            label: item.name,
          }))}
          selectedOptionId={
            entitlement.selection?.choices[0]?.itemId ?? null
          }
          onSelect={(optionId) => setChoices([optionId])}
        />
      ) : (
        <ul className="equipment-source-card__item-picks">
          {eligible.map((item) => {
            const checked = selectedIds.has(item.id)
            const atMax = selectedIds.size >= max && !checked
            return (
              <li key={item.id}>
                <label className="equipment-source-card__item-pick">
                  <input
                    type="checkbox"
                    name={`${controlId}-${item.id}`}
                    checked={checked}
                    disabled={atMax}
                    onChange={() => {
                      if (checked) {
                        setChoices(
                          [...selectedIds].filter((id) => id !== item.id),
                        )
                        return
                      }
                      if (selectedIds.size >= max) {
                        return
                      }
                      setChoices([...selectedIds, item.id])
                    }}
                  />
                  <span>{item.name}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </fieldset>
  )
}

function ChooseOptionEditor({
  source,
  entitlement,
  selections,
  catalogueItems,
  onChangeSelections,
  nested,
  itemNameById,
}: {
  source: ResolvedEquipmentSource
  entitlement: ResolvedEquipmentEntitlement
  selections: EquipmentSelection[]
  catalogueItems: readonly EquipmentItemDefinition[]
  onChangeSelections: (next: EquipmentSelection[]) => void
  nested: boolean
  itemNameById: ReadonlyMap<string, string>
}) {
  const definition = entitlement.entitlement
  if (definition.type !== 'choose-option') {
    return null
  }

  const options = definition.options.map((option) => ({
    id: option.id,
    label: option.label,
    description: formatEquipmentOptionPreview(option, itemNameById),
  }))

  const selectedOptionId = entitlement.selection?.optionId ?? null
  const legendId = useId()
  const controlId = `${source.source.kind}-${entitlement.path.join('-')}-${definition.id}`

  const onSelect = (optionId: string) => {
    onChangeSelections(
      upsertEquipmentOptionSelection(
        selections,
        source.source,
        definition.id,
        optionId,
        entitlement.path,
      ),
    )
  }

  const nestedChildren = source.entitlements.filter(
    (entry) =>
      entry.path.length === entitlement.path.length + 1 &&
      entitlement.path.every((segment, index) => entry.path[index] === segment) &&
      selectedOptionId !== null &&
      entry.path[entitlement.path.length] === selectedOptionId,
  )

  return (
    <div
      className={
        nested
          ? 'equipment-source-card__branch equipment-source-card__branch--nested'
          : 'equipment-source-card__branch'
      }
    >
      <fieldset
        className="equipment-source-card__choice"
        aria-labelledby={legendId}
      >
        <legend id={legendId} className="equipment-source-card__choice-title">
          {definition.label}
        </legend>

        {options.length <= 3 ? (
          <SingleSelectCardGrid
            id={controlId}
            name={controlId}
            options={options}
            selectedOptionId={selectedOptionId}
            onSelect={onSelect}
          />
        ) : (
          <ChoiceAccordion
            id={controlId}
            title={definition.label}
            options={options}
            selectedOptionId={selectedOptionId}
            name={controlId}
            onSelect={onSelect}
          />
        )}
      </fieldset>

      {nestedChildren.length > 0 ? (
        <div className="equipment-source-card__nested" role="group">
          {nestedChildren.map((child) => (
            <EntitlementEditor
              key={`${child.path.join('/')}:${child.entitlement.id}`}
              source={source}
              entitlement={child}
              selections={selections}
              catalogueItems={catalogueItems}
              onChangeSelections={onChangeSelections}
              nested
              itemNameById={itemNameById}
              renderRootOnly={false}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function EntitlementEditor({
  source,
  entitlement,
  selections,
  catalogueItems,
  onChangeSelections,
  nested,
  itemNameById,
  renderRootOnly,
}: {
  source: ResolvedEquipmentSource
  entitlement: ResolvedEquipmentEntitlement
  selections: EquipmentSelection[]
  catalogueItems: readonly EquipmentItemDefinition[]
  onChangeSelections: (next: EquipmentSelection[]) => void
  nested: boolean
  itemNameById: ReadonlyMap<string, string>
  /** When true, skip nodes that are nested under another choose-option. */
  renderRootOnly: boolean
}) {
  if (renderRootOnly && entitlement.path.length > 0) {
    return null
  }

  const definition = entitlement.entitlement

  if (definition.type === 'grant') {
    return null
  }

  if (definition.type === 'choose-items') {
    return (
      <ChooseItemsEditor
        source={source}
        entitlement={entitlement}
        selections={selections}
        catalogueItems={catalogueItems}
        onChangeSelections={onChangeSelections}
        nested={nested}
      />
    )
  }

  return (
    <ChooseOptionEditor
      source={source}
      entitlement={entitlement}
      selections={selections}
      catalogueItems={catalogueItems}
      onChangeSelections={onChangeSelections}
      nested={nested}
      itemNameById={itemNameById}
    />
  )
}

function SourceItemList({ items }: { items: ResolvedInventoryItem[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <ul className="equipment-source-card__items">
      {items.map((item) => (
        <li key={item.itemId}>
          <span aria-hidden="true">✓ </span>
          {formatInventoryLine(item)}
        </li>
      ))}
    </ul>
  )
}

export function EquipmentSourceSection({
  source,
  selections,
  catalogueItems,
  onChangeSelections,
}: EquipmentSourceSectionProps) {
  const itemNameById = new Map(
    catalogueItems.map((item) => [item.id, item.name]),
  )

  return (
    <section
      className="equipment-source-card"
      aria-labelledby={`equipment-source-${source.label}`}
    >
      <header className="equipment-source-card__header">
        <div className="equipment-source-card__title-row">
          <h3 id={`equipment-source-${source.label}`}>
            {source.label} Equipment
          </h3>
          <EquipmentSourceBadge kind={source.sourceKindLabel} />
        </div>
        {source.completeness === 'simplified' ? (
          <p className="equipment-source-card__simplified">
            Simplified starting equipment — full options coming later.
          </p>
        ) : null}
      </header>

      {source.entitlements.map((entitlement) => (
        <EntitlementEditor
          key={`${entitlement.path.join('/')}:${entitlement.entitlement.id}`}
          source={source}
          entitlement={entitlement}
          selections={selections}
          catalogueItems={catalogueItems}
          onChangeSelections={onChangeSelections}
          nested={false}
          itemNameById={itemNameById}
          renderRootOnly
        />
      ))}

      <SourceItemList items={source.items} />
      {source.currency.goldPieces > 0 ? (
        <p className="equipment-source-card__currency">
          ✓ {formatGoldPieces(source.currency.goldPieces)}
        </p>
      ) : null}
    </section>
  )
}
