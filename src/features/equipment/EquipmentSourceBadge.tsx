import type { EquipmentSourceKindLabel } from '../../domain/equipment/types'

type EquipmentSourceBadgeProps = {
  kind: EquipmentSourceKindLabel
}

export function EquipmentSourceBadge({ kind }: EquipmentSourceBadgeProps) {
  return (
    <span className={`equipment-source-badge equipment-source-badge--${kind.toLowerCase()}`}>
      {kind}
    </span>
  )
}
