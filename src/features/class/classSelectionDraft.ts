import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassLevel,
  ClassSelection,
  CharacterClassSelection,
} from '../../domain/class/types'
import { pruneClassInstanceChoicesForLevel } from '../../domain/class/pruneClassInstanceChoices'
import type { EditionId } from '../../domain/types'
import {
  validateClassInstance,
  validateClassSelection,
  type ClassValidationResult,
} from '../../rules/class/classRules'

/** Legacy single-class draft payload used by the current ClassPicker UI. */
export type ClassSelectionDraft = {
  classId: string
  level: ClassSelection['level']
  choices: Record<string, ClassChoiceValue>
}

/** Instance-scoped draft stored by stable instance id. */
export type CharacterClassSelectionDraft = {
  instanceId: string
  classId: string
  level: ClassLevel
  choices: Record<string, ClassChoiceValue>
}

export type ClassSelectionDrafts = Record<string, CharacterClassSelectionDraft>

export function createEmptyClassSelectionDrafts(): ClassSelectionDrafts {
  return {}
}

export function createClassInstanceDraft(
  instanceId: string,
  classId: string,
): CharacterClassSelectionDraft {
  return {
    instanceId,
    classId,
    level: 1,
    choices: {},
  }
}

/** @deprecated Use createClassInstanceDraft with a generated instance id. */
export function createClassSelectionDraft(classId: string): ClassSelectionDraft {
  return {
    classId,
    level: 1,
    choices: {},
  }
}

export function instanceDraftToLegacyDraft(
  draft: CharacterClassSelectionDraft,
): ClassSelectionDraft {
  return {
    classId: draft.classId,
    level: draft.level,
    choices: { ...draft.choices },
  }
}

export function legacyDraftToInstanceDraft(
  draft: ClassSelectionDraft,
  instanceId: string,
): CharacterClassSelectionDraft {
  return {
    instanceId,
    classId: draft.classId,
    level: draft.level,
    choices: { ...draft.choices },
  }
}

export function instanceDraftToClassInstance(
  draft: CharacterClassSelectionDraft,
): CharacterClassSelection {
  return {
    instanceId: draft.instanceId,
    classId: draft.classId,
    level: draft.level,
    choices: { ...draft.choices },
  }
}

export function initializeClassInstanceDraft(
  instance: CharacterClassSelection,
): CharacterClassSelectionDraft {
  return {
    instanceId: instance.instanceId,
    classId: instance.classId,
    level: instance.level,
    choices: { ...instance.choices },
  }
}

export function initializeClassSelectionDraft(
  selection: ClassSelection,
  instanceId: string,
): CharacterClassSelectionDraft {
  return legacyDraftToInstanceDraft(
    {
      classId: selection.classId,
      level: selection.level,
      choices: selection.choices,
    },
    instanceId,
  )
}

export function getLegacyDraftForInstance(
  drafts: ClassSelectionDrafts,
  instanceId: string | null,
): ClassSelectionDraft | null {
  if (instanceId === null) {
    return null
  }

  const draft = drafts[instanceId]

  return draft === undefined ? null : instanceDraftToLegacyDraft(draft)
}

export function setLegacyDraftForInstance(
  drafts: ClassSelectionDrafts,
  instanceId: string,
  legacyDraft: ClassSelectionDraft,
): ClassSelectionDrafts {
  return {
    ...drafts,
    [instanceId]: legacyDraftToInstanceDraft(legacyDraft, instanceId),
  }
}

export function removeInstanceDraft(
  drafts: ClassSelectionDrafts,
  instanceId: string,
): ClassSelectionDrafts {
  const next = { ...drafts }
  delete next[instanceId]
  return next
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

export function updateClassInstanceDraftChoice(
  draft: CharacterClassSelectionDraft,
  choiceId: string,
  value: ClassChoiceValue | undefined,
): CharacterClassSelectionDraft {
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

export function updateClassInstanceDraftLevel(
  draft: CharacterClassSelectionDraft,
  level: ClassLevel,
  definition: ClassDefinition,
): CharacterClassSelectionDraft {
  const instance = instanceDraftToClassInstance(draft)
  const pruned = pruneClassInstanceChoicesForLevel(instance, definition, level)

  return {
    ...draft,
    level: pruned.level,
    choices: pruned.choices,
  }
}

export function updateClassDraftLevel(
  draft: ClassSelectionDraft,
  level: ClassLevel,
  definition: ClassDefinition,
): ClassSelectionDraft {
  const instance = legacyDraftToInstanceDraft(draft, '__draft__')
  const pruned = pruneClassInstanceChoicesForLevel(instance, definition, level)

  return {
    ...draft,
    level: pruned.level,
    choices: pruned.choices,
  }
}

export function tryCommitClassInstanceDraft(
  draft: CharacterClassSelectionDraft,
  editionId: EditionId,
  definition: ClassDefinition | null,
): {
  committed: CharacterClassSelection | null
  validation: ClassValidationResult
} {
  const instance = instanceDraftToClassInstance(draft)
  const validation = validateClassInstance(instance, editionId, definition)

  if (!validation.ok) {
    return { committed: null, validation: toLegacyValidation(validation) }
  }

  return { committed: instance, validation: { ok: true } }
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

function toLegacyValidation(
  result: Extract<
    ReturnType<typeof validateClassInstance>,
    { ok: false }
  >,
): ClassValidationResult {
  return {
    ok: false,
    issues: result.errors.map((error) => ({
      code: error.code,
      choiceId: error.choiceId,
    })),
  }
}

export function isClassInstanceDraftIncomplete(
  drafts: ClassSelectionDrafts,
  instanceId: string,
  committedClasses: CharacterClassSelection[],
): boolean {
  const draft = drafts[instanceId]

  if (draft === undefined) {
    return false
  }

  const committed = committedClasses.find(
    (instance) => instance.instanceId === instanceId,
  )

  return committed === undefined
}

export function isClassDraftIncomplete(
  draft: ClassSelectionDraft | null,
  committedSelection: ClassSelection | null,
): boolean {
  return draft !== null && committedSelection === null
}

export function isAnyClassDraftIncomplete(
  drafts: ClassSelectionDrafts,
  committedClasses: CharacterClassSelection[],
): boolean {
  return Object.keys(drafts).some((instanceId) =>
    isClassInstanceDraftIncomplete(drafts, instanceId, committedClasses),
  )
}
