import type { ClassChoiceValue, ClassSelection } from './types'
import { isHitPointIncrease } from './hitPointIncreases'

function isClassChoiceValue(value: unknown): value is ClassChoiceValue {
  if (typeof value === 'string') {
    return true
  }

  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === 'string' && entry.length > 0)
  )
}

export function isClassSelection(value: unknown): value is ClassSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.classId !== 'string' ||
    candidate.classId.length === 0
  ) {
    return false
  }

  if (
    typeof candidate.level !== 'number' ||
    !Number.isInteger(candidate.level) ||
    candidate.level < 1 ||
    candidate.level > 20
  ) {
    return false
  }

  if (typeof candidate.choices !== 'object' || candidate.choices === null) {
    return false
  }

  const choices = candidate.choices as Record<string, unknown>

  if (!Object.values(choices).every(isClassChoiceValue)) {
    return false
  }

  if (candidate.hitPointIncreases === undefined) {
    return true
  }

  return (
    Array.isArray(candidate.hitPointIncreases) &&
    candidate.hitPointIncreases.every(isHitPointIncrease)
  )
}
