import type { EquipmentStatusWarning } from '../../domain/equipment/equipmentStatusWarnings'

export type EquipmentStatusPanelProps = {
  warnings: readonly EquipmentStatusWarning[]
}

export function EquipmentStatusPanel({ warnings }: EquipmentStatusPanelProps) {
  if (warnings.length === 0) {
    return null
  }

  return (
    <section
      className="equipment-status"
      aria-labelledby="equipment-status-heading"
    >
      <h4 id="equipment-status-heading" className="equipment-status__heading">
        Equipment Status
      </h4>
      <ul className="equipment-status__list">
        {warnings.map((warning) => (
          <li key={warning.id} className="equipment-status__item">
            <p className="equipment-status__title">
              <span aria-hidden="true">⚠ </span>
              {warning.title}
            </p>
            <p className="equipment-status__detail">{warning.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
