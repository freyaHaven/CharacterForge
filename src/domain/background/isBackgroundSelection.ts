import { isAbilityId } from '../abilities/types'
import type {
  AbilityScoreIncreaseSelection,
  BackgroundSelection,
} from './types'

function isAbilityScoreIncreaseSelection(
  value: unknown,
): value is AbilityScoreIncreaseSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (candidate.mode === 'three-one') {
    return true
  }

  if (candidate.mode !== 'two-and-one') {
    return false
  }

  return (
    isAbilityId(candidate.plusTwo) &&
    isAbilityId(candidate.plusOne) &&
    candidate.plusTwo !== candidate.plusOne
  )
}

export function isBackgroundSelection(
  value: unknown,
): value is BackgroundSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.backgroundId !== 'string' ||
    candidate.backgroundId.length === 0
  ) {
    return false
  }

  if (!isAbilityScoreIncreaseSelection(candidate.abilityScoreIncrease)) {
    return false
  }

  if (typeof candidate.choices !== 'object' || candidate.choices === null) {
    return false
  }

  const choices = candidate.choices as Record<string, unknown>

  return Object.values(choices).every(
    (choice) =>
      typeof choice === 'string' ||
      (Array.isArray(choice) &&
        choice.every((entry) => typeof entry === 'string')),
  )
}
