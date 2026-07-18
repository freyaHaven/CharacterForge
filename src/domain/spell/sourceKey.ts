import type { SpellSourceRef } from './types'

/** Stable serialized key for maps, migrations, and equality. */
export function spellSourceKey(source: SpellSourceRef): string {
  switch (source.kind) {
    case 'class-instance':
      return `class:${source.instanceId}:${source.entitlementId}`
    case 'feat':
      return `feat:${source.slot}:${source.featId}:${source.entitlementId}`
    case 'background-origin':
      return `background-origin:${source.backgroundId}:${source.entitlementId}`
    case 'species-trait':
      return `species:${source.speciesId}:${source.traitId}:${source.entitlementId}`
  }
}

export function spellSourcesEqual(
  a: SpellSourceRef,
  b: SpellSourceRef,
): boolean {
  return spellSourceKey(a) === spellSourceKey(b)
}
