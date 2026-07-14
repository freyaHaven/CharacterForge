import type { CharacterCreationMethod } from '../domain/types'
import type { PointBuyValidationResult } from '../rules/point-buy'
import type { StandardArrayDraftValidationResult } from '../features/ability-scores/standardArrayDraft'
import type { RolledAssignmentValidationResult } from '../rules/rolled'

type SaveValidationState = {
  standardArrayValidation: StandardArrayDraftValidationResult | null
  pointBuyValidation: PointBuyValidationResult | null
  rolledValidation: RolledAssignmentValidationResult | null
}

export function canSaveCharacter(
  creationMethod: CharacterCreationMethod,
  validation: SaveValidationState,
): boolean {
  if (creationMethod === 'standard-array') {
    return validation.standardArrayValidation?.valid === true
  }

  if (creationMethod === 'point-buy') {
    return validation.pointBuyValidation?.valid === true
  }

  if (creationMethod === 'rolled') {
    return validation.rolledValidation?.valid === true
  }

  return true
}
