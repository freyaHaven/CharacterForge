import type { SpeciesDefinition } from '../../domain/species/types'
import type {
  SpeciesSelection,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'
import type { EditionId } from '../../domain/types'
import {
  validateSpeciesSelection,
  type SpeciesValidationOptions,
  type SpeciesValidationResult,
} from '../../rules/species/speciesRules'

export type SpeciesSelectionDraft = {
  speciesId: string
  choices: Record<string, SpeciesSelectionChoiceValue>
}

export function createSpeciesSelectionDraft(
  speciesId: string,
): SpeciesSelectionDraft {
  return {
    speciesId,
    choices: {},
  }
}

export function initializeSpeciesSelectionDraft(
  selection: SpeciesSelection,
): SpeciesSelectionDraft {
  return {
    speciesId: selection.speciesId,
    choices: { ...selection.choices },
  }
}

export function draftToSpeciesSelection(
  draft: SpeciesSelectionDraft,
): SpeciesSelection {
  return {
    speciesId: draft.speciesId,
    choices: { ...draft.choices },
  }
}

export function updateSpeciesDraftChoice(
  draft: SpeciesSelectionDraft,
  choiceId: string,
  optionId: SpeciesSelectionChoiceValue | undefined,
): SpeciesSelectionDraft {
  const nextChoices = { ...draft.choices }

  if (optionId === undefined) {
    delete nextChoices[choiceId]
  } else if (Array.isArray(optionId) && optionId.length === 0) {
    delete nextChoices[choiceId]
  } else {
    nextChoices[choiceId] = optionId
  }

  return {
    ...draft,
    choices: nextChoices,
  }
}

export function tryCommitSpeciesDraft(
  draft: SpeciesSelectionDraft,
  editionId: EditionId,
  definition: SpeciesDefinition | null,
  options?: SpeciesValidationOptions,
): {
  committed: SpeciesSelection | null
  validation: SpeciesValidationResult
} {
  const selection = draftToSpeciesSelection(draft)
  const validation = validateSpeciesSelection(
    selection,
    editionId,
    definition,
    options,
  )

  if (!validation.ok) {
    return { committed: null, validation }
  }

  return { committed: selection, validation }
}

export function isSpeciesDraftIncomplete(
  draft: SpeciesSelectionDraft | null,
  committedSelection: SpeciesSelection | null,
): boolean {
  return draft !== null && committedSelection === null
}
