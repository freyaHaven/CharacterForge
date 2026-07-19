import { ChoiceAccordion } from '../choices/ChoiceAccordion'
import { SingleSelectCardGrid } from '../choices/SingleSelectCardGrid'
import type { EquipmentSelection } from '../../domain/equipment/types'
import {
  equipmentSourcesEqual,
} from '../../domain/equipment/sourceKey'
import type {
  ResolvedEquipmentEntitlement,
  ResolvedEquipmentSource,
  ResolvedInventoryItem,
} from '../../rules/character/resolveCharacterEquipment'
import { EquipmentSourceBadge } from './EquipmentSourceBadge'
import { formatGoldPieces, formatInventoryLine } from './formatEquipment'

type EquipmentSourceSectionProps = {
  source: ResolvedEquipmentSource
  selections: EquipmentSelection[]
  onChangeSelections: (next: EquipmentSelection[]) => void
}

function upsertOptionSelection(
  selections: EquipmentSelection[],
  source: ResolvedEquipmentSource['source'],
  entitlementId: string,
  optionId: string,
): EquipmentSelection[] {
  const next: EquipmentSelection = {
    source,
    entitlementId,
    optionId,
    choices: [],
  }

  const index = selections.findIndex(
    (entry) =>
      equipmentSourcesEqual(entry.source, source) &&
      entry.entitlementId === entitlementId,
  )

  if (index === -1) {
    return [...selections, next]
  }

  return selections.map((entry, entryIndex) =>
    entryIndex === index ? next : entry,
  )
}

function EntitlementEditor({
  source,
  entitlement,
  selections,
  onChangeSelections,
}: {
  source: ResolvedEquipmentSource
  entitlement: ResolvedEquipmentEntitlement
  selections: EquipmentSelection[]
  onChangeSelections: (next: EquipmentSelection[]) => void
}) {
  const definition = entitlement.entitlement

  if (definition.type === 'grant') {
    return null
  }

  if (definition.type === 'choose-items') {
    return (
      <p className="equipment-source-card__note">
        Item catalogue picks for this entitlement are not available yet.
      </p>
    )
  }

  const options = definition.options.map((option) => ({
    id: option.id,
    label: option.label,
  }))

  const selectedOptionId = entitlement.selection?.optionId ?? null
  const controlId = `${source.source.kind}-${definition.id}`

  if (options.length <= 3) {
    return (
      <div className="equipment-source-card__choice">
        <h4 className="equipment-source-card__choice-title">{definition.label}</h4>
        <SingleSelectCardGrid
          id={controlId}
          name={controlId}
          options={options}
          selectedOptionId={selectedOptionId}
          onSelect={(optionId) =>
            onChangeSelections(
              upsertOptionSelection(
                selections,
                source.source,
                definition.id,
                optionId,
              ),
            )
          }
        />
      </div>
    )
  }

  return (
    <ChoiceAccordion
      id={controlId}
      title={definition.label}
      options={options}
      selectedOptionId={selectedOptionId}
      name={controlId}
      onSelect={(optionId) =>
        onChangeSelections(
          upsertOptionSelection(
            selections,
            source.source,
            definition.id,
            optionId,
          ),
        )
      }
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
  onChangeSelections,
}: EquipmentSourceSectionProps) {
  return (
    <section className="equipment-source-card" aria-labelledby={`equipment-source-${source.label}`}>
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
          key={entitlement.entitlement.id}
          source={source}
          entitlement={entitlement}
          selections={selections}
          onChangeSelections={onChangeSelections}
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
