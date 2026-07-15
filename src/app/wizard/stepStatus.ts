import type { Character } from '../../domain/types'
import { hasCharacterDetailsContent } from '../../domain/character/details'
import { getCommittedClassSelection } from '../../domain/character/characterClassSelection'
import type { ClassSelectionDraft } from '../../features/class/classSelectionDraft'
import { isClassDraftIncomplete } from '../../features/class/classSelectionDraft'
import type { BackgroundSelectionDraft } from '../../features/background/backgroundSelectionDraft'
import { isBackgroundDraftIncomplete } from '../../features/background/backgroundSelectionDraft'
import type { FeatSelectionDraft } from '../../features/feat/featSelectionDraft'
import { isFeatDraftIncomplete } from '../../features/feat/featSelectionDraft'
import type { SpeciesSelectionDraft } from '../../features/species/speciesSelectionDraft'
import { isSpeciesDraftIncomplete } from '../../features/species/speciesSelectionDraft'
import type { PointBuyValidationResult } from '../../rules/point-buy'
import type { RolledAssignmentValidationResult } from '../../rules/rolled'
import type { ClassValidationResult } from '../../rules/class/classRules'
import type { BackgroundValidationResult } from '../../rules/background/backgroundRules'
import type { FeatValidationResult } from '../../rules/feat/featRules'
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
  /** User has edited any Character Details field. */
  detailsTouched: boolean
  /** User has changed the creation method or ability score inputs. */
  abilityScoresTouched: boolean

  speciesDraft: SpeciesSelectionDraft | null
  /** Validation of the active species draft; null when no draft exists. */
  speciesDraftValidation: SpeciesValidationResult | null
  /** Whether the committed species selection is valid for the current edition. */
  committedSpeciesValid: boolean

  classDraft: ClassSelectionDraft | null
  /** Validation of the active class draft; null when no draft exists. */
  classDraftValidation: ClassValidationResult | null
  /** Whether the committed class selection is valid for the current edition. */
  committedClassValid: boolean

  backgroundDraft: BackgroundSelectionDraft | null
  /** Validation of the active background draft; null when no draft exists. */
  backgroundDraftValidation: BackgroundValidationResult | null
  /** Whether the committed background selection is valid for the current edition. */
  committedBackgroundValid: boolean

  featDraft: FeatSelectionDraft | null
  /** Validation of the active feat draft; null when no draft exists. */
  featDraftValidation: FeatValidationResult | null
  /** Whether the committed feat selection is valid for the current edition. */
  committedFeatValid: boolean

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
    classDraftIncomplete: false,
    backgroundDraftIncomplete: false,
    featDraftIncomplete: false,
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

export function getClassStepStatus(context: StepValidationContext): StepStatus {
  const { character, classDraft } = context
  const committed = getCommittedClassSelection(character)

  if (
    committed !== null &&
    context.committedClassValid &&
    !isClassDraftIncomplete(classDraft, committed)
  ) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (classDraft === null && committed === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  const hasValidationErrors =
    (classDraft !== null && context.classDraftValidation?.ok === false) ||
    (committed !== null && !context.committedClassValid)

  return { completion: 'in-progress', hasValidationErrors }
}

export function getBackgroundStepStatus(
  context: StepValidationContext,
): StepStatus {
  const { character, backgroundDraft } = context
  const committed = character.background

  if (
    committed !== null &&
    context.committedBackgroundValid &&
    !isBackgroundDraftIncomplete(backgroundDraft, committed)
  ) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (backgroundDraft === null && committed === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  const hasValidationErrors =
    (backgroundDraft !== null &&
      context.backgroundDraftValidation?.ok === false) ||
    (committed !== null && !context.committedBackgroundValid)

  return { completion: 'in-progress', hasValidationErrors }
}

export function getFeatStepStatus(context: StepValidationContext): StepStatus {
  const { character, featDraft } = context
  const committed = character.feat

  if (
    committed !== null &&
    context.committedFeatValid &&
    !isFeatDraftIncomplete(featDraft, committed)
  ) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (featDraft === null && committed === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  const hasValidationErrors =
    (featDraft !== null && context.featDraftValidation?.ok === false) ||
    (committed !== null && !context.committedFeatValid)

  return { completion: 'in-progress', hasValidationErrors }
}

export function getCharacterDetailsStepStatus(
  context: StepValidationContext,
): StepStatus {
  if (hasCharacterDetailsContent(context.character.details)) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  if (context.detailsTouched) {
    return { completion: 'in-progress', hasValidationErrors: false }
  }

  return { completion: 'not-started', hasValidationErrors: false }
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
    'character-details': getCharacterDetailsStepStatus(context),
    'ability-scores': getAbilityScoresStepStatus(context),
    class: getClassStepStatus(context),
    background: getBackgroundStepStatus(context),
    equipment: getPlaceholderStepStatus(),
    feats: getFeatStepStatus(context),
    spells: getPlaceholderStepStatus(),
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
