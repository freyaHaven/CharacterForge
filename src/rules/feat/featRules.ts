import type { FeatDefinition, FeatSelection } from '../../domain/feat/types'
import {
  validateFeatDefinitionChoices,
  type FeatChoiceValidationContext,
  type FeatChoiceValidationIssue,
} from '../../domain/feat/validateFeatChoices'
import type { EditionId } from '../../domain/types'

export type FeatValidationIssueCode =
  | 'feat-not-found'
  | 'wrong-edition'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'invalid-multi-select-count'
  | 'duplicate-selection'
  | 'already-proficient'
  | 'unknown-choice'
  | 'ability-score-maximum-exceeded'

export type FeatValidationIssue = {
  code: FeatValidationIssueCode
  choiceId?: string
}

export type FeatValidationResult =
  | { ok: true }
  | { ok: false; issues: FeatValidationIssue[] }

function mapChoiceIssue(
  issue: FeatChoiceValidationIssue,
): FeatValidationIssue {
  return {
    code: issue.code,
    choiceId: issue.choiceId,
  }
}

export function validateFeatSelection(
  selection: FeatSelection,
  editionId: EditionId,
  definition: FeatDefinition | null,
  context?: FeatChoiceValidationContext,
): FeatValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'feat-not-found' }] }
  }

  if (definition.editionId !== editionId) {
    return { ok: false, issues: [{ code: 'wrong-edition' }] }
  }

  const choiceIssues = validateFeatDefinitionChoices(
    definition,
    selection.choices,
    context,
  )

  if (choiceIssues.length > 0) {
    return { ok: false, issues: choiceIssues.map(mapChoiceIssue) }
  }

  return { ok: true }
}

export async function needsEditionChangeFeatConfirmation(
  selection: FeatSelection | null,
  nextEditionId: EditionId,
  getDefinition: (featId: string) => Promise<FeatDefinition | null>,
): Promise<boolean> {
  if (selection === null) {
    return false
  }

  const definition = await getDefinition(selection.featId)

  if (definition === null) {
    return true
  }

  return definition.editionId !== nextEditionId
}
