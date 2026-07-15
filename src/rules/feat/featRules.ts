import type { FeatDefinition, FeatSelection } from '../../domain/feat/types'
import type { EditionId } from '../../domain/types'

export type FeatValidationIssueCode =
  | 'feat-not-found'
  | 'wrong-edition'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'unknown-choice'

export type FeatValidationIssue = {
  code: FeatValidationIssueCode
  choiceId?: string
}

export type FeatValidationResult =
  | { ok: true }
  | { ok: false; issues: FeatValidationIssue[] }

export function validateFeatSelection(
  selection: FeatSelection,
  editionId: EditionId,
  definition: FeatDefinition | null,
): FeatValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'feat-not-found' }] }
  }

  if (definition.editionId !== editionId) {
    return { ok: false, issues: [{ code: 'wrong-edition' }] }
  }

  const issues: FeatValidationIssue[] = []

  for (const choice of definition.choices) {
    const selectedOptionId = selection.choices[choice.id]

    if (choice.required && selectedOptionId === undefined) {
      issues.push({ code: 'missing-required-choice', choiceId: choice.id })
      continue
    }

    if (selectedOptionId === undefined) {
      continue
    }

    const isValidOption = choice.options.some(
      (option) => option.id === selectedOptionId,
    )

    if (!isValidOption) {
      issues.push({ code: 'invalid-choice', choiceId: choice.id })
    }
  }

  for (const choiceId of Object.keys(selection.choices)) {
    const isKnownChoice = definition.choices.some(
      (choice) => choice.id === choiceId,
    )

    if (!isKnownChoice) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
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
