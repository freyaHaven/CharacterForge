import type { Character } from '../../domain/types'
import type { SpeciesSelectionDraft } from '../../features/species/speciesSelectionDraft'
import { isSpeciesDraftIncomplete } from '../../features/species/speciesSelectionDraft'
import type { PointBuyValidationResult } from '../../rules/point-buy'
import type { RolledAssignmentValidationResult } from '../../rules/rolled'
import type { SpeciesValidationResult } from '../../rules/species/speciesRules'
import type { StandardArrayDraftValidationResult } from '../../features/ability-scores/standardArrayDraft'
import { canSaveCharacter } from '../characterSavePolicy'
import { WIZARD_STEPS } from './steps'
import type { StepStatus, WizardStepId } from './types'

/**
 * Inputs for computing wizard step status.
 * Character data plus pre-computed validation results and explicit UI interaction
 * signals. Nothing here is persisted on Character.
 */
export type StepValidationContext = {
  character: Character

  /** User has edited or focused the name field on the Basics step. */
  basicsTouched: boolean
  /** User has changed the creation method or ability score inputs. */
  abilityScoresTouched: boolean

  speciesDraft: SpeciesSelectionDraft | null
  /** Validation of the active species draft; null when no draft exists. */
  speciesDraftValidation: SpeciesValidationResult | null
  /** Whether the committed species selection is valid for the current edition. */
  committedSpeciesValid: boolean

  standardArrayValidation: StandardArrayDraftValidationResult | null
  pointBuyValidation: PointBuyValidationResult | null
  rolledValidation: RolledAssignmentValidationResult | null
}

type NonReviewStepId = Exclude<WizardStepId, 'review'>

function isAbilityScoresMethodValid(context: StepValidationContext): boolean {
  return canSaveCharacter(context.character.creationMethod, {
    standardArrayValidation: context.standardArrayValidation,
    pointBuyValidation: context.pointBuyValidation,
    rolledValidation: context.rolledValidation,
    speciesDraftIncomplete: false,
  })
}

export function getBasicsStepStatus(context: StepValidationContext): StepStatus {
  const nameComplete = context.character.name.trim().length > 0

  if (nameComplete) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (!context.basicsTouched) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  return { completion: 'in-progress', hasValidationErrors: true }
}

export function getSpeciesStepStatus(context: StepValidationContext): StepStatus {
  const { character, speciesDraft } = context
  const committed = character.species

  if (
    committed !== null &&
    context.committedSpeciesValid &&
    !isSpeciesDraftIncomplete(speciesDraft, committed)
  ) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (speciesDraft === null && committed === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  const hasValidationErrors =
    (speciesDraft !== null && context.speciesDraftValidation?.ok === false) ||
    (committed !== null && !context.committedSpeciesValid)

  return { completion: 'in-progress', hasValidationErrors }
}

export function getPlaceholderStepStatus(): StepStatus {
  return { completion: 'not-started', hasValidationErrors: false }
}

export function getAbilityScoresStepStatus(
  context: StepValidationContext,
): StepStatus {
  const methodValid = isAbilityScoresMethodValid(context)

  if (methodValid && context.abilityScoresTouched) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (!context.abilityScoresTouched) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  return {
    completion: 'in-progress',
    hasValidationErrors: !methodValid,
  }
}

export function getReviewStepStatus(
  stepStatuses: Record<NonReviewStepId, StepStatus>,
): StepStatus {
  const requiredStepIds = WIZARD_STEPS.filter(
    (step) => step.required && step.id !== 'review',
  ).map((step) => step.id) as NonReviewStepId[]

  const allRequiredComplete = requiredStepIds.every(
    (stepId) => stepStatuses[stepId].completion === 'complete',
  )
  const anyRequiredErrors = requiredStepIds.some(
    (stepId) => stepStatuses[stepId].hasValidationErrors,
  )

  return {
    completion: allRequiredComplete ? 'complete' : 'in-progress',
    hasValidationErrors: anyRequiredErrors,
  }
}

export function getNonReviewStepStatuses(
  context: StepValidationContext,
): Record<NonReviewStepId, StepStatus> {
  return {
    basics: getBasicsStepStatus(context),
    species: getSpeciesStepStatus(context),
    class: getPlaceholderStepStatus(),
    'ability-scores': getAbilityScoresStepStatus(context),
    background: getPlaceholderStepStatus(),
    equipment: getPlaceholderStepStatus(),
  }
}

export function getStepStatus(
  stepId: WizardStepId,
  context: StepValidationContext,
): StepStatus {
  if (stepId === 'review') {
    return getReviewStepStatus(getNonReviewStepStatuses(context))
  }

  return getNonReviewStepStatuses(context)[stepId]
}

export function getAllStepStatuses(
  context: StepValidationContext,
): Record<WizardStepId, StepStatus> {
  const nonReviewStatuses = getNonReviewStepStatuses(context)

  return {
    ...nonReviewStatuses,
    review: getReviewStepStatus(nonReviewStatuses),
  }
}

export function getRequiredStepIds(): readonly WizardStepId[] {
  return WIZARD_STEPS.filter((step) => step.required).map((step) => step.id)
}
