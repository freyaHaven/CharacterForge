import type { FeatDefinition } from '../../domain/feat/types'
import type { FeatSelection } from '../../domain/feat/types'
import type { EditionId } from '../../domain/types'
import {
  validateFeatSelection,
  type FeatValidationResult,
} from '../../rules/feat/featRules'

export type FeatSelectionDraft = {
  featId: string
  choices: Record<string, string>
}

export function createFeatSelectionDraft(featId: string): FeatSelectionDraft {
  return {
    featId,
    choices: {},
  }
}

export function initializeFeatSelectionDraft(
  selection: FeatSelection,
): FeatSelectionDraft {
  return {
    featId: selection.featId,
    choices: { ...selection.choices },
  }
}

export function draftToFeatSelection(
  draft: FeatSelectionDraft,
): FeatSelection {
  return {
    featId: draft.featId,
    choices: { ...draft.choices },
  }
}

export function updateFeatDraftChoice(
  draft: FeatSelectionDraft,
  choiceId: string,
  optionId: string | undefined,
): FeatSelectionDraft {
  const nextChoices = { ...draft.choices }

  if (optionId === undefined) {
    delete nextChoices[choiceId]
  } else {
    nextChoices[choiceId] = optionId
  }

  return {
    ...draft,
    choices: nextChoices,
  }
}

export function tryCommitFeatDraft(
  draft: FeatSelectionDraft,
  editionId: EditionId,
  definition: FeatDefinition | null,
): {
  committed: FeatSelection | null
  validation: FeatValidationResult
} {
  const selection = draftToFeatSelection(draft)
  const validation = validateFeatSelection(selection, editionId, definition)

  if (!validation.ok) {
    return { committed: null, validation }
  }

  return { committed: selection, validation }
}

export function isFeatDraftIncomplete(
  draft: FeatSelectionDraft | null,
  committedSelection: FeatSelection | null,
): boolean {
  return draft !== null && committedSelection === null
}
