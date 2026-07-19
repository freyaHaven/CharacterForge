import type {
  EquipmentLoadout,
  EquipmentSelection,
} from '../../../domain/equipment/types'
import type { EquipmentCatalog } from '../../../domain/ports/equipmentCatalog'
import type { ResolvedEquipment } from '../../../rules/character/resolveCharacterEquipment'
import type { EquipmentValidationIssue } from '../../../rules/equipment/validateEquipmentSelections'
import { EquipmentSourceSection } from '../../../features/equipment/EquipmentSourceSection'
import { EquipmentLoadoutManager } from '../../../features/equipment/EquipmentLoadoutManager'
import { formatGoldPieces } from '../../../features/equipment/formatEquipment'
import { useEquipmentDefinitions } from '../../../features/equipment/useEquipmentDefinitions'

type EquipmentStepProps = {
  resolved: ResolvedEquipment
  selections: EquipmentSelection[]
  loadout: EquipmentLoadout
  equipmentCatalog: EquipmentCatalog
  onChangeSelections: (next: EquipmentSelection[]) => void
  onChangeLoadout: (next: EquipmentLoadout) => void
  validationIssues: EquipmentValidationIssue[]
}

export function EquipmentStep({
  resolved,
  selections,
  loadout,
  equipmentCatalog,
  onChangeSelections,
  onChangeLoadout,
  validationIssues,
}: EquipmentStepProps) {
  const hasSources = resolved.sources.length > 0
  const definitionsById = useEquipmentDefinitions(
    resolved.inventory,
    equipmentCatalog,
  )

  return (
    <section
      aria-labelledby="wizard-step-equipment-heading"
      className="wizard-step-panel"
    >
      <h2 id="wizard-step-equipment-heading">Equipment</h2>
      <p className="wizard-step-panel__intro">
        Choose the equipment your character starts with. Some items are granted
        automatically, while others depend on your class and background choices.
      </p>

      {!hasSources ? (
        <p className="wizard-step-panel__placeholder">
          Select a class (and optionally a background) to choose starting
          equipment.
        </p>
      ) : null}

      {validationIssues.length > 0 ? (
        <ul className="equipment-step__issues" aria-live="polite">
          {validationIssues.map((issue) => (
            <li key={`${issue.sourceLabel}-${issue.entitlementId}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="equipment-step__sources">
        {resolved.sources.map((source) => (
          <EquipmentSourceSection
            key={`${source.sourceKindLabel}-${source.label}`}
            source={source}
            selections={selections}
            onChangeSelections={onChangeSelections}
          />
        ))}
      </div>

      {hasSources ? (
        <section
          className="equipment-step__summary"
          aria-labelledby="starting-equipment-summary-heading"
        >
          <h3 id="starting-equipment-summary-heading">Starting Equipment</h3>
          {resolved.inventory.length === 0 &&
          resolved.currency.goldPieces === 0 ? (
            <p className="equipment-step__summary-empty">
              No equipment selected yet.
            </p>
          ) : (
            <>
              <EquipmentLoadoutManager
                inventory={resolved.inventory}
                loadout={loadout}
                definitionsById={definitionsById}
                onChangeLoadout={onChangeLoadout}
                showNonEquippableItems
              />
              {resolved.currency.goldPieces > 0 ? (
                <p className="equipment-step__summary-gold">
                  <span aria-hidden="true">✓ </span>
                  {formatGoldPieces(resolved.currency.goldPieces)}
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </section>
  )
}
