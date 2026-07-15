import type { CharacterCreationMethod } from '../domain/types'
import type { PointBuyValidationResult } from '../rules/point-buy'
import type { StandardArrayDraftValidationResult } from '../features/ability-scores/standardArrayDraft'
import type { RolledAssignmentValidationResult } from '../rules/rolled'

export function formatSaveBlockedMessage(
  creationMethod: CharacterCreationMethod,
  speciesDraftIncomplete: boolean,
  classDraftIncomplete: boolean,
  backgroundDraftIncomplete: boolean,
  featDraftIncomplete: boolean,
): string {
  if (speciesDraftIncomplete) {
    return 'Complete the species selection before saving.'
  }

  if (classDraftIncomplete) {
    return 'Complete the class selection before saving.'
  }

  if (backgroundDraftIncomplete) {
    return 'Complete the background selection before saving.'
  }

  if (featDraftIncomplete) {
    return 'Complete the feat selection before saving.'
  }

  if (creationMethod === 'point-buy') {
    return 'Fix the point-buy assignment before saving.'
  }

  if (creationMethod === 'rolled') {
    return 'Complete the rolled assignment before saving.'
  }

  return 'Complete the standard array assignment before saving.'
}

type SaveValidationState = {
  standardArrayValidation: StandardArrayDraftValidationResult | null
  pointBuyValidation: PointBuyValidationResult | null
  rolledValidation: RolledAssignmentValidationResult | null
  speciesDraftIncomplete: boolean
  classDraftIncomplete: boolean
  backgroundDraftIncomplete: boolean
  featDraftIncomplete: boolean
}

export function canSaveCharacter(
  creationMethod: CharacterCreationMethod,
  validation: SaveValidationState,
): boolean {
  if (
    validation.speciesDraftIncomplete ||
    validation.classDraftIncomplete ||
    validation.backgroundDraftIncomplete ||
    validation.featDraftIncomplete
  ) {
    return false
  }

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
