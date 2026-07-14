import { getAbilityModifier } from '../domain/abilities'
import type { AbilityScores, Character } from '../domain/types'
import type { ClassSelectionDraft } from '../features/class/classSelectionDraft'
import type { SpeciesSelectionDraft } from '../features/species/speciesSelectionDraft'
import { CREATION_METHOD_OPTIONS } from '../features/creation-method/creationMethodOptions'
import { EDITION_OPTIONS } from '../features/edition-picker/editionOptions'
import type { PointBuyValidationResult } from '../rules/point-buy'
import type { RolledAssignmentValidationResult } from '../rules/rolled'
import type { StandardArrayDraftValidationResult } from '../features/ability-scores/standardArrayDraft'
import { WIZARD_STEPS } from './wizard/steps'
import type { StepStatus, WizardStepId } from './wizard/types'
import { formatStepStatusDescription } from './wizard/formatStepStatus'

export type ReviewableStepId = Exclude<WizardStepId, 'review'>

export const REVIEWABLE_STEP_IDS: readonly ReviewableStepId[] = WIZARD_STEPS.filter(
  (step): step is ReviewableStepId => step.id !== 'review',
).map((step) => step.id)

export type SpeciesReviewDisplay = {
  speciesName: string | null
  ancestryLabel: string | null
}

export type ClassReviewDisplay = {
  className: string | null
  fightingStyleLabel: string | null
  skillLabels: string[]
}

export type ReviewSummaryContext = {
  character: Character
  speciesDraft: SpeciesSelectionDraft | null
  speciesDisplay: SpeciesReviewDisplay
  classDraft: ClassSelectionDraft | null
  classDisplay: ClassReviewDisplay
  standardArrayValidation: StandardArrayDraftValidationResult | null
  pointBuyValidation: PointBuyValidationResult | null
  rolledValidation: RolledAssignmentValidationResult | null
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
    if (context.classDisplay.fightingStyleLabel !== null) {
      lines.push(`Fighting Style: ${context.classDisplay.fightingStyleLabel}`)
    }
    if (context.classDisplay.skillLabels.length > 0) {
      lines.push(`Skills: ${context.classDisplay.skillLabels.join(', ')}`)
    }
    return lines
  }

  if (status.hasValidationErrors) {
    const lines =
      className === null
        ? ['Choice incomplete']
        : [`Class: ${className}`, 'Choice incomplete']
    return lines
  }

  if (className !== null) {
    return [`Class: ${className}`, 'Confirm your selection']
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
    class: buildClassSummary(context, stepStatuses.class),
    'ability-scores': buildAbilityScoresSummary(context),
    background: buildPlaceholderSummary(),
    equipment: buildPlaceholderSummary(),
  }
}

export function getReviewStepLabel(stepId: ReviewableStepId): string {
  return WIZARD_STEPS.find((step) => step.id === stepId)?.label ?? stepId
}
