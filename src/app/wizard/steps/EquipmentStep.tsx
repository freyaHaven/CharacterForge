import type {
  EquipmentSelection,
} from '../../../domain/equipment/types'
import type { ResolvedEquipment } from '../../../rules/character/resolveCharacterEquipment'
import type { EquipmentValidationIssue } from '../../../rules/equipment/validateEquipmentSelections'
import { EquipmentSourceSection } from '../../../features/equipment/EquipmentSourceSection'

type EquipmentStepProps = {
  resolved: ResolvedEquipment
  selections: EquipmentSelection[]
  onChangeSelections: (next: EquipmentSelection[]) => void
  validationIssues: EquipmentValidationIssue[]
}

export function EquipmentStep({
  resolved,
  selections,
  onChangeSelections,
  validationIssues,
}: EquipmentStepProps) {
  const hasSources = resolved.sources.length > 0

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
    </section>
  )
}
