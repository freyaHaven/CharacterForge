import { getAbilityModifier } from '../domain/abilities'
import type { AbilityScores, Character, ResolvedDeferredCharacterRequirement } from '../domain/types'
import type { ClassSelectionDraft } from '../features/class/classSelectionDraft'
import type { BackgroundSelectionDraft } from '../features/background/backgroundSelectionDraft'
import type { FeatSelectionDraft } from '../features/feat/featSelectionDraft'
import type { SpeciesSelectionDraft } from '../features/species/speciesSelectionDraft'
import { formatCharacterDetailsReviewLines, formatCharacterDetailsReviewSections, hasCharacterDetailsReviewContent, type CharacterDetailsReviewSections } from '../features/character-details/formatCharacterDetailsReview'
import { CREATION_METHOD_OPTIONS } from '../features/creation-method/creationMethodOptions'
import { EDITION_OPTIONS } from '../features/edition-picker/editionOptions'
import type { PointBuyValidationResult } from '../rules/point-buy'
import type { RolledAssignmentValidationResult } from '../rules/rolled'
import type { StandardArrayDraftValidationResult } from '../features/ability-scores/standardArrayDraft'
import { WIZARD_STEPS } from './wizard/steps'
import {
  createWizardStepContext,
  getVisibleWizardSteps,
  type WizardStepContext,
} from './wizard/stepVisibility'
import type { StepStatus, WizardStepId } from './wizard/types'
import { formatStepStatusDescription } from './wizard/formatStepStatus'

export type ReviewableStepId = Exclude<WizardStepId, 'review'>

export function getReviewableStepIds(
  context: WizardStepContext,
): ReviewableStepId[] {
  return getVisibleWizardSteps(context)
    .map((step) => step.id)
    .filter((id): id is ReviewableStepId => id !== 'review')
}

export const REVIEWABLE_STEP_IDS: readonly ReviewableStepId[] = WIZARD_STEPS.map(
  (step) => step.id,
).filter((id): id is ReviewableStepId => id !== 'review')

export type SpeciesReviewDisplay = {
  speciesName: string | null
  ancestryLabel: string | null
}

export type ClassReviewEntry = {
  classId: string
  className: string
  level: number
  subclassName: string | null
}

export type ClassReviewChoiceEntry = {
  label: string
  description: string
}

export type ClassReviewChoiceLine = {
  /** Used to route skills vs features and for text step summaries. */
  prompt: string
  /** Compact summary for text step summaries. */
  summary: string
  /** Heading shown under Class Features (defaults to prompt when omitted). */
  heading?: string
  /** Body text under the heading (e.g. Fighting Style rules). */
  description?: string
  /** Nested selections with their own descriptions (e.g. Weapon Mastery). */
  entries?: ClassReviewChoiceEntry[]
}

export type ClassReviewDisplay = {
  entries: ClassReviewEntry[]
  className: string | null
  subclassName: string | null
  level: number | null
  characterLevel: number | null
  choiceLines: ClassReviewChoiceLine[]
}

export type BackgroundReviewDisplay = {
  backgroundName: string | null
  choiceLines: { prompt: string; summary: string }[]
}

export type FeatReviewDisplay = {
  featName: string | null
}

export type ReviewSummaryContext = {
  character: Character
  speciesDraft: SpeciesSelectionDraft | null
  speciesDisplay: SpeciesReviewDisplay
  classDraft: ClassSelectionDraft | null
  classDisplay: ClassReviewDisplay
  backgroundDraft: BackgroundSelectionDraft | null
  backgroundDisplay: BackgroundReviewDisplay
  featDraft: FeatSelectionDraft | null
  featDisplay: FeatReviewDisplay
  unresolvedDeferredRequirements: ResolvedDeferredCharacterRequirement[]
  standardArrayValidation: StandardArrayDraftValidationResult | null
  pointBuyValidation: PointBuyValidationResult | null
  rolledValidation: RolledAssignmentValidationResult | null
  /** Derived starting equipment lines for the Overview equipment section. */
  equipmentLines?: string[]
}

const ABILITY_SUMMARY_LABELS: { key: keyof AbilityScores; label: string }[] = [
  { key: 'strength', label: 'STR' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'constitution', label: 'CON' },
  { key: 'intelligence', label: 'INT' },
  { key: 'wisdom', label: 'WIS' },
  { key: 'charisma', label: 'CHA' },
]

export function formatReviewStatusLabel(status: StepStatus): string {
  return formatStepStatusDescription(status)
}

function getEditionLabel(editionId: Character['editionId']): string {
  return (
    EDITION_OPTIONS.find((option) => option.id === editionId)?.label ??
    editionId
  )
}

function getCreationMethodLabel(
  creationMethod: Character['creationMethod'],
): string {
  return (
    CREATION_METHOD_OPTIONS.find((option) => option.id === creationMethod)
      ?.label ?? creationMethod
  )
}

function formatModifier(score: number): string {
  const modifier = getAbilityModifier(score)
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function formatAbilityScoreLines(scores: AbilityScores): string[] {
  return ABILITY_SUMMARY_LABELS.map(({ key, label }) => {
    const score = scores[key]
    return `${label} ${score} (${formatModifier(score)})`
  })
}

function buildBasicsSummary(context: ReviewSummaryContext): string[] {
  const name = context.character.name.trim()
  return [
    name.length > 0 ? `Name: ${name}` : 'Name: (not entered yet)',
    `Edition: ${getEditionLabel(context.character.editionId)}`,
  ]
}

function buildSpeciesSummary(
  context: ReviewSummaryContext,
  status: StepStatus,
): string[] {
  if (status.completion === 'not-started') {
    return ['Not selected']
  }

  const speciesName = context.speciesDisplay.speciesName

  if (status.completion === 'complete') {
    const lines = [`Species: ${speciesName ?? 'Selected species'}`]
    if (context.speciesDisplay.ancestryLabel !== null) {
      lines.push(`Ancestry: ${context.speciesDisplay.ancestryLabel}`)
    }
    return lines
  }

  if (status.hasValidationErrors) {
    const lines =
      speciesName === null
        ? ['Choice incomplete']
        : [`Species: ${speciesName}`, 'Choice incomplete']
    return lines
  }

  if (speciesName !== null) {
    return [`Species: ${speciesName}`, 'Confirm your selection']
  }

  return ['Not selected']
}

function buildClassSummary(
  context: ReviewSummaryContext,
  status: StepStatus,
): string[] {
  if (status.completion === 'not-started') {
    return ['Not selected']
  }

  const className = context.classDisplay.className

  if (status.completion === 'complete') {
    const lines = [`Class: ${className ?? 'Selected class'}`]
    if (context.classDisplay.level !== null) {
      lines.push(`Level: ${context.classDisplay.level}`)
    }
    for (const choiceLine of context.classDisplay.choiceLines) {
      lines.push(`${choiceLine.prompt}: ${choiceLine.summary}`)
    }
    lines.push('Class selection complete')
    if (context.unresolvedDeferredRequirements.length > 0) {
      lines.push('Remaining character decisions:')
      for (const requirement of context.unresolvedDeferredRequirements) {
        lines.push(`- ${requirement.description}`)
      }
    }
    return lines
  }

  if (status.hasValidationErrors) {
    const lines =
      className === null
        ? ['Choice incomplete']
        : [
            `Class: ${className}`,
            ...(context.classDisplay.level !== null
              ? [`Level: ${context.classDisplay.level}`]
              : []),
            'Choice incomplete',
          ]
    return lines
  }

  if (className !== null) {
    return [
      `Class: ${className}`,
      ...(context.classDisplay.level !== null
        ? [`Level: ${context.classDisplay.level}`]
        : []),
      'Confirm your selection',
    ]
  }

  return ['Not selected']
}

function buildBackgroundSummary(
  context: ReviewSummaryContext,
  status: StepStatus,
): string[] {
  if (status.completion === 'not-started') {
    return ['Not selected']
  }

  const backgroundName = context.backgroundDisplay.backgroundName

  if (status.completion === 'complete') {
    const lines = [`Background: ${backgroundName ?? 'Selected background'}`]
    for (const choiceLine of context.backgroundDisplay.choiceLines) {
      lines.push(`${choiceLine.prompt}: ${choiceLine.summary}`)
    }
    return lines
  }

  if (status.hasValidationErrors) {
    const lines =
      backgroundName === null
        ? ['Choice incomplete']
        : [`Background: ${backgroundName}`, 'Choice incomplete']
    return lines
  }

  if (backgroundName !== null) {
    return [`Background: ${backgroundName}`, 'Confirm your selection']
  }

  return ['Not selected']
}

function buildFeatSummary(
  context: ReviewSummaryContext,
  status: StepStatus,
): string[] {
  if (status.completion === 'not-started') {
    return ['Not selected']
  }

  const featName = context.featDisplay.featName

  if (status.completion === 'complete') {
    return [`Feat: ${featName ?? 'Selected feat'}`]
  }

  if (status.hasValidationErrors) {
    return featName === null
      ? ['Choice incomplete']
      : [`Feat: ${featName}`, 'Choice incomplete']
  }

  if (featName !== null) {
    return [`Feat: ${featName}`, 'Confirm your selection']
  }

  return ['Not selected']
}

function buildAbilityScoresSummary(context: ReviewSummaryContext): string[] {
  const { character } = context
  const lines = [
    `Method: ${getCreationMethodLabel(character.creationMethod)}`,
    ...formatAbilityScoreLines(character.abilityScores),
  ]

  if (character.creationMethod === 'standard-array') {
    lines.push(
      context.standardArrayValidation?.valid === true
        ? 'Standard Array: assignment complete'
        : 'Standard Array: assignment incomplete',
    )
  }

  if (character.creationMethod === 'point-buy' && context.pointBuyValidation) {
    lines.push(
      `Point Buy: ${context.pointBuyValidation.spent} / 27 spent · ${context.pointBuyValidation.remaining} remaining`,
    )
  }

  if (character.creationMethod === 'rolled') {
    lines.push(
      context.rolledValidation?.valid === true
        ? 'Rolled: assignment complete'
        : 'Rolled: assignment incomplete',
    )
  }

  return lines
}

function buildCharacterDetailsSummary(context: ReviewSummaryContext): string[] {
  return formatCharacterDetailsReviewLines(context.character.details)
}

export function buildCharacterDetailsReviewSections(
  context: ReviewSummaryContext,
): CharacterDetailsReviewSections {
  return formatCharacterDetailsReviewSections(context.character.details)
}

export { hasCharacterDetailsReviewContent, type CharacterDetailsReviewSections }

function buildEquipmentSummary(context: ReviewSummaryContext): string[] {
  if (context.equipmentLines !== undefined && context.equipmentLines.length > 0) {
    return context.equipmentLines
  }

  if (context.character.classes.length === 0 && context.character.background === null) {
    return ['Select a class to choose starting equipment']
  }

  if (
    context.equipmentLines !== undefined &&
    context.equipmentLines.length === 0
  ) {
    return ['No equipment selected yet']
  }

  return ['No equipment selected yet']
}

function buildPlaceholderSummary(): string[] {
  return ['Coming soon']
}

export function buildReviewSummaries(
  context: ReviewSummaryContext,
  stepStatuses: Record<ReviewableStepId, StepStatus>,
): Record<ReviewableStepId, string[]> {
  return {
    basics: buildBasicsSummary(context),
    species: buildSpeciesSummary(context, stepStatuses.species),
    'character-details': buildCharacterDetailsSummary(context),
    'ability-scores': buildAbilityScoresSummary(context),
    class: buildClassSummary(context, stepStatuses.class),
    background: buildBackgroundSummary(context, stepStatuses.background),
    equipment: buildEquipmentSummary(context),
    feats: buildFeatSummary(context, stepStatuses.feats),
    spells: buildPlaceholderSummary(),
  }
}

export function getVisibleReviewableStepIds(
  context: ReviewSummaryContext,
): ReviewableStepId[] {
  return getReviewableStepIds(createWizardStepContext(context.character))
}

export function getReviewStepLabel(stepId: ReviewableStepId): string {
  return WIZARD_STEPS.find((step) => step.id === stepId)?.label ?? stepId
}
