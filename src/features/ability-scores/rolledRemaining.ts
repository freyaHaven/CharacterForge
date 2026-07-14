import type { RolledPoolEntry } from '../../rules/rolled'
import { getRemainingRolledResults } from '../../rules/rolled'

export function formatRemainingRolledResults(
  remaining: readonly RolledPoolEntry[],
): string {
  if (remaining.length === 0) {
    return 'None'
  }

  return remaining.map((entry) => entry.total).join(', ')
}

export { getRemainingRolledResults }
