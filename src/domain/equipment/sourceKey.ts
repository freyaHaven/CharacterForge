import type { EquipmentSourceRef } from './types'

/** Stable serialized key for maps, migrations, and equality. */
export function equipmentSourceKey(source: EquipmentSourceRef): string {
  switch (source.kind) {
    case 'class-instance':
      return `class-instance:${source.instanceId}`
    case 'background':
      return `background:${source.backgroundId}`
    case 'species':
      return source.traitId === undefined
        ? `species:${source.speciesId}`
        : `species:${source.speciesId}:${source.traitId}`
    case 'feat':
      return source.slot === undefined
        ? `feat:${source.featId}`
        : `feat:${source.slot}:${source.featId}`
  }
}

export function equipmentSourcesEqual(
  a: EquipmentSourceRef,
  b: EquipmentSourceRef,
): boolean {
  return equipmentSourceKey(a) === equipmentSourceKey(b)
}

/**
 * Stable selection key including optional nested path
 * (`path` empty → root entitlement).
 */
export function equipmentSelectionKey(
  source: EquipmentSourceRef,
  entitlementId: string,
  path: readonly string[] = [],
): string {
  const pathSuffix = path.length === 0 ? '' : `::${path.join('/')}`
  return `${equipmentSourceKey(source)}::${entitlementId}${pathSuffix}`
}
