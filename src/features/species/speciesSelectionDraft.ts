import type { SpeciesDefinition } from '../../domain/species/types'
import type {
  SpeciesSelection,
  SpeciesSelectionChoiceValue,
} from '../../domain/species/types'
import { clearFeatGrantChoices, isFeatGrantChoiceStorageKey } from '../../domain/feat/featGrantChoiceStorage'
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
  let nextChoices: Record<string, SpeciesSelectionChoiceValue> = {
    ...draft.choices,
  }

  const previous = draft.choices[choiceId]
  const previousFeatId = typeof previous === 'string' ? previous : undefined
  const nextFeatId = typeof optionId === 'string' ? optionId : undefined

  // When a feat-grant slot changes feat id (or clears), drop nested companion keys.
  if (
    !isFeatGrantChoiceStorageKey(choiceId) &&
    previousFeatId !== nextFeatId
  ) {
    nextChoices = clearFeatGrantChoices(
      nextChoices,
      choiceId,
    ) as Record<string, SpeciesSelectionChoiceValue>
  }

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
