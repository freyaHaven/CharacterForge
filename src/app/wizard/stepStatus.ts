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
import type { SpellValidationResult } from '../../rules/spell/validateSpellSourceStates'
import type { EquipmentValidationResult } from '../../rules/equipment/validateEquipmentSelections'
import type { SpeciesValidationResult } from '../../rules/species/speciesRules'
import type { StandardArrayDraftValidationResult } from '../../features/ability-scores/standardArrayDraft'
import { canSaveCharacter } from '../characterSavePolicy'
import { WIZARD_STEPS } from './steps'
import { getVisibleWizardSteps, type WizardStepContext } from './stepVisibility'
import type { StepStatus, WizardStepId } from './types'

/**
 * Steps that use {@link getPlaceholderStepStatus} and have no completion
 * criteria yet. They stay visible in nav but are skipped when choosing the
 * first incomplete step.
 */
export const PLACEHOLDER_WIZARD_STEP_IDS = [] as const satisfies readonly WizardStepId[]

export function isPlaceholderWizardStep(stepId: WizardStepId): boolean {
  return (PLACEHOLDER_WIZARD_STEP_IDS as readonly WizardStepId[]).includes(
    stepId,
  )
}

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

  /** Validation of spell source states; null when Spells step has no content. */
  spellValidation: SpellValidationResult | null
  /** Whether committed spell source states are valid (or spells step inactive). */
  committedSpellsValid: boolean

  /** Validation of equipment selections; null when Equipment step has no sources. */
  equipmentValidation: EquipmentValidationResult | null
  /** Whether committed equipment selections are valid (or no sources active). */
  committedEquipmentValid: boolean

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

export function getSpellsStepStatus(context: StepValidationContext): StepStatus {
  if (context.spellValidation === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  if (context.spellValidation.ok && context.committedSpellsValid) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  const hasValidationErrors =
    context.spellValidation.ok === false || !context.committedSpellsValid

  const hasAnySelection = context.character.spellSourceStates.some(
    (state) => state.selections.length > 0,
  )

  return {
    completion: hasAnySelection || hasValidationErrors ? 'in-progress' : 'not-started',
    hasValidationErrors,
  }
}

export function getEquipmentStepStatus(
  context: StepValidationContext,
): StepStatus {
  if (context.equipmentValidation === null) {
    return { completion: 'not-started', hasValidationErrors: false }
  }

  if (context.equipmentValidation.ok && context.committedEquipmentValid) {
    return { completion: 'complete', hasValidationErrors: false }
  }

  const hasValidationErrors =
    context.equipmentValidation.ok === false || !context.committedEquipmentValid

  const hasAnySelection = context.character.equipment.selections.length > 0

  return {
    completion:
      hasAnySelection || hasValidationErrors ? 'in-progress' : 'not-started',
    hasValidationErrors,
  }
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
    equipment: getEquipmentStepStatus(context),
    feats: getFeatStepStatus(context),
    spells: getSpellsStepStatus(context),
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

/**
 * Returns the first applicable incomplete wizard step in navigation order, or
 * `review` (Overview) when every visible non-placeholder step is complete.
 *
 * Uses the same step statuses and visibility rules as the wizard nav.
 */
export function getFirstIncompleteCharacterStep(
  stepStatuses: Record<WizardStepId, StepStatus>,
  context: WizardStepContext,
): WizardStepId {
  for (const step of getVisibleWizardSteps(context)) {
    if (step.id === 'review' || isPlaceholderWizardStep(step.id)) {
      continue
    }

    if (stepStatuses[step.id].completion !== 'complete') {
      return step.id
    }
  }

  return 'review'
}
