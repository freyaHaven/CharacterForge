import type { SpellCountSpec } from '../../domain/spell/types'
import { tableValueAtLevel } from '../../domain/spell/progressions'

export function resolveSpellCount(
  count: SpellCountSpec,
  sourceLevel: number,
): number {
  switch (count.kind) {
    case 'fixed':
    case 'extra-fixed':
      return Math.max(0, count.value)
    case 'by-source-level':
      return tableValueAtLevel(count.table, sourceLevel)
  }
}
