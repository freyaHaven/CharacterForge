import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { EditionId } from '../../domain/types'
import {
  validateClassSelection,
  type ClassValidationResult,
} from '../../rules/class/classRules'

export type ClassSelectionDraft = {
  classId: string
  level: ClassSelection['level']
  choices: Record<string, ClassChoiceValue>
}

export function createClassSelectionDraft(classId: string): ClassSelectionDraft {
  return {
    classId,
    level: 1,
    choices: {},
  }
}

export function initializeClassSelectionDraft(
  selection: ClassSelection,
): ClassSelectionDraft {
  return {
    classId: selection.classId,
    level: selection.level,
    choices: { ...selection.choices },
  }
}

export function draftToClassSelection(
  draft: ClassSelectionDraft,
): ClassSelection {
  return {
    classId: draft.classId,
    level: draft.level,
    choices: { ...draft.choices },
  }
}

export function updateClassDraftChoice(
  draft: ClassSelectionDraft,
  choiceId: string,
  value: ClassChoiceValue | undefined,
): ClassSelectionDraft {
  const nextChoices = { ...draft.choices }

  if (value === undefined) {
    delete nextChoices[choiceId]
  } else {
    nextChoices[choiceId] = value
  }

  return {
    ...draft,
    choices: nextChoices,
  }
}

export function tryCommitClassDraft(
  draft: ClassSelectionDraft,
  editionId: EditionId,
  definition: ClassDefinition | null,
): {
  committed: ClassSelection | null
  validation: ClassValidationResult
} {
  const selection = draftToClassSelection(draft)
  const validation = validateClassSelection(selection, editionId, definition)

  if (!validation.ok) {
    return { committed: null, validation }
  }

  return { committed: selection, validation }
}

export function isClassDraftIncomplete(
  draft: ClassSelectionDraft | null,
  committedSelection: ClassSelection | null,
): boolean {
  return draft !== null && committedSelection === null
}
