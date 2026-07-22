import { useEffect, useState } from 'react'
import type {
  EquipmentItemDefinition,
  EquipmentSelection,
} from '../../../domain/equipment/types'
import type { EquipmentCatalog } from '../../../domain/ports/equipmentCatalog'
import type { EditionId } from '../../../domain/edition'
import type { ResolvedEquipment } from '../../../rules/character/resolveCharacterEquipment'
import type { EquipmentValidationIssue } from '../../../rules/equipment/validateEquipmentSelections'
import { EquipmentSourceSection } from '../../../features/equipment/EquipmentSourceSection'

type EquipmentStepProps = {
  resolved: ResolvedEquipment
  selections: EquipmentSelection[]
  onChangeSelections: (next: EquipmentSelection[]) => void
  validationIssues: EquipmentValidationIssue[]
  equipmentCatalog: EquipmentCatalog
  editionId: EditionId
}

export function EquipmentStep({
  resolved,
  selections,
  onChangeSelections,
  validationIssues,
  equipmentCatalog,
  editionId,
}: EquipmentStepProps) {
  const hasSources = resolved.sources.length > 0
  const [catalogueItems, setCatalogueItems] = useState<
    EquipmentItemDefinition[]
  >([])

  useEffect(() => {
    let isActive = true

    void (async () => {
      const items = await equipmentCatalog.listEquipment(editionId)
      if (isActive) {
        setCatalogueItems(items)
      }
    })()

    return () => {
      isActive = false
    }
  }, [editionId, equipmentCatalog])

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
            <li
              key={`${issue.sourceLabel}-${issue.entitlementId}-${issue.message}`}
            >
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
            catalogueItems={catalogueItems}
            onChangeSelections={onChangeSelections}
          />
        ))}
      </div>
    </section>
  )
}
