import type { CharacterCreationMethod } from '../../domain/types'
import type { CardSelectOption } from '../choices/SingleSelectCardGrid'

export type AbilityScoreMethodUiId =
  | 'standard-array'
  | 'point-buy'
  | 'manual-rolled'

export const ABILITY_SCORE_METHOD_UI_OPTIONS: readonly CardSelectOption[] = [
  { id: 'standard-array', label: 'Standard Array' },
  { id: 'point-buy', label: 'Point Buy' },
  { id: 'manual-rolled', label: 'Manual / Rolled' },
]

export function toAbilityScoreMethodUiId(
  creationMethod: CharacterCreationMethod,
): AbilityScoreMethodUiId {
  if (creationMethod === 'standard-array' || creationMethod === 'point-buy') {
    return creationMethod
  }

  return 'manual-rolled'
}

export function toCreationMethodFromUiId(
  uiId: AbilityScoreMethodUiId,
  currentMethod: CharacterCreationMethod,
): CharacterCreationMethod {
  if (uiId === 'standard-array' || uiId === 'point-buy') {
    return uiId
  }

  if (currentMethod === 'manual' || currentMethod === 'rolled') {
    return currentMethod
  }

  return 'manual'
}

export function isManualOrRolledMethod(
  creationMethod: CharacterCreationMethod,
): boolean {
  return creationMethod === 'manual' || creationMethod === 'rolled'
}
