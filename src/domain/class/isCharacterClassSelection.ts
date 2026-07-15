import type { CharacterClassSelection } from './types'
import { isClassSelection } from './isClassSelection'

export function isCharacterClassSelection(
  value: unknown,
): value is CharacterClassSelection {
  if (!isClassSelection(value)) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.instanceId === 'string' && candidate.instanceId.length > 0
  )
}
