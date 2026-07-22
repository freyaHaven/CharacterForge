import type {
  ClassChoiceValue,
  ClassDefinition,
  ClassLevel,
  ClassSelection,
  CharacterClassSelection,
} from '../../domain/class/types'
import {
  isAbilityScoreImprovementChoiceId,
  parseAsiChoice,
} from '../../domain/class/abilityScoreImprovement'
import { isEpicBoonChoiceId } from '../../domain/class/epicBoon'
import {
  getFightingStyleFeatIdFromChoiceValue,
  isFightingStyleFeatGrantChoiceId,
} from '../../domain/class/fightingStyle'
import {
  syncHitPointIncreases,
  type HitPointIncrease,
} from '../../domain/class/hitPointIncreases'
import { pruneClassInstanceChoicesForLevel } from '../../domain/class/pruneClassInstanceChoices'
import { clearFeatGrantChoices } from '../../domain/feat/featGrantChoiceStorage'
import type { EditionId } from '../../domain/types'
import {
  validateClassInstance,
  validateClassSelection,
  type ClassValidationOptions,
  type ClassValidationResult,
} from '../../rules/class/classRules'

function getFeatGrantFeatIdFromChoiceValue(
  choiceId: string,
  value: ClassChoiceValue | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null
  }

  if (isAbilityScoreImprovementChoiceId(choiceId) || isEpicBoonChoiceId(choiceId)) {
    const parsed = parseAsiChoice(value)
    return parsed?.kind === 'feat' ? parsed.featId : null
  }

  if (isFightingStyleFeatGrantChoiceId(choiceId)) {
    return getFightingStyleFeatIdFromChoiceValue(value)
  }

  return null
}

function isFeatGrantHostChoiceId(choiceId: string): boolean {
  return (
    isAbilityScoreImprovementChoiceId(choiceId) ||
    isEpicBoonChoiceId(choiceId) ||
    isFightingStyleFeatGrantChoiceId(choiceId)
  )
}

/**
 * When an ASI / Epic Boon / Fighting Style grant value leaves feat mode or
 * switches to a different feat, drop nested companion keys for that slot.
 */
function withClearedFeatGrantChoicesIfNeeded(
  choices: Record<string, ClassChoiceValue>,
  choiceId: string,
  previousValue: ClassChoiceValue | undefined,
  nextValue: ClassChoiceValue | undefined,
): Record<string, ClassChoiceValue> {
  if (!isFeatGrantHostChoiceId(choiceId)) {
    return choices
  }

  const previousFeatId = getFeatGrantFeatIdFromChoiceValue(choiceId, previousValue)
  const nextFeatId = getFeatGrantFeatIdFromChoiceValue(choiceId, nextValue)

  if (previousFeatId === nextFeatId) {
    return choices
  }

  return clearFeatGrantChoices(choices, choiceId) as Record<string, ClassChoiceValue>
}

/** Legacy single-class draft payload used by the current ClassPicker UI. */
export type ClassSelectionDraft = {
  classId: string
  level: ClassSelection['level']
  choices: Record<string, ClassChoiceValue>
  hitPointIncreases?: HitPointIncrease[]
}

/** Instance-scoped draft stored by stable instance id. */
export type CharacterClassSelectionDraft = {
  instanceId: string
  classId: string
  level: ClassLevel
  choices: Record<string, ClassChoiceValue>
  hitPointIncreases?: HitPointIncrease[]
}

export type ClassSelectionDrafts = Record<string, CharacterClassSelectionDraft>

export function createEmptyClassSelectionDrafts(): ClassSelectionDrafts {
  return {}
}

function defaultHitPointIncreases(
  level: number,
  isStartingClass: boolean,
): HitPointIncrease[] {
  return syncHitPointIncreases(undefined, level, { isStartingClass })
}

export function createClassInstanceDraft(
  instanceId: string,
  classId: string,
  options: { isStartingClass?: boolean } = {},
): CharacterClassSelectionDraft {
  return {
    instanceId,
    classId,
    level: 1,
    choices: {},
    hitPointIncreases: defaultHitPointIncreases(1, options.isStartingClass ?? false),
  }
}

/** @deprecated Use createClassInstanceDraft with a generated instance id. */
export function createClassSelectionDraft(
  classId: string,
  options: { isStartingClass?: boolean } = {},
): ClassSelectionDraft {
  return {
    classId,
    level: 1,
    choices: {},
    hitPointIncreases: defaultHitPointIncreases(1, options.isStartingClass ?? true),
  }
}

export function instanceDraftToLegacyDraft(
  draft: CharacterClassSelectionDraft,
): ClassSelectionDraft {
  return {
    classId: draft.classId,
    level: draft.level,
    choices: { ...draft.choices },
    ...(draft.hitPointIncreases !== undefined
      ? { hitPointIncreases: draft.hitPointIncreases.map((entry) => ({ ...entry })) }
      : {}),
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
    ...(draft.hitPointIncreases !== undefined
      ? { hitPointIncreases: draft.hitPointIncreases.map((entry) => ({ ...entry })) }
      : {}),
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
    ...(draft.hitPointIncreases !== undefined
      ? { hitPointIncreases: draft.hitPointIncreases.map((entry) => ({ ...entry })) }
      : {}),
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
    ...(instance.hitPointIncreases !== undefined
      ? { hitPointIncreases: instance.hitPointIncreases.map((entry) => ({ ...entry })) }
      : {}),
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
      ...(selection.hitPointIncreases !== undefined
        ? { hitPointIncreases: selection.hitPointIncreases }
        : {}),
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
    ...(draft.hitPointIncreases !== undefined
      ? { hitPointIncreases: draft.hitPointIncreases.map((entry) => ({ ...entry })) }
      : {}),
  }
}

export function updateClassInstanceDraftChoice(
  draft: CharacterClassSelectionDraft,
  choiceId: string,
  value: ClassChoiceValue | undefined,
): CharacterClassSelectionDraft {
  let nextChoices = withClearedFeatGrantChoicesIfNeeded(
    { ...draft.choices },
    choiceId,
    draft.choices[choiceId],
    value,
  )

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
  definition?: ClassDefinition,
): ClassSelectionDraft {
  let nextChoices = withClearedFeatGrantChoicesIfNeeded(
    { ...draft.choices },
    choiceId,
    draft.choices[choiceId],
    value,
  )

  if (value === undefined) {
    delete nextChoices[choiceId]
  } else {
    nextChoices[choiceId] = value
  }

  if (definition === undefined) {
    return {
      ...draft,
      choices: nextChoices,
    }
  }

  const pruned = pruneClassInstanceChoicesForLevel(
    {
      instanceId: '__draft__',
      classId: draft.classId,
      level: draft.level,
      choices: nextChoices,
      hitPointIncreases: draft.hitPointIncreases,
    },
    definition,
    draft.level,
  )

  return {
    ...draft,
    choices: pruned.choices,
  }
}

export function updateClassInstanceDraftLevel(
  draft: CharacterClassSelectionDraft,
  level: ClassLevel,
  definition: ClassDefinition,
  options: { isStartingClass?: boolean } = {},
): CharacterClassSelectionDraft {
  const instance = instanceDraftToClassInstance(draft)
  const pruned = pruneClassInstanceChoicesForLevel(instance, definition, level)

  return {
    ...draft,
    level: pruned.level,
    choices: pruned.choices,
    hitPointIncreases: syncHitPointIncreases(draft.hitPointIncreases, pruned.level, {
      isStartingClass: options.isStartingClass ?? false,
    }),
  }
}

export function updateClassDraftLevel(
  draft: ClassSelectionDraft,
  level: ClassLevel,
  definition: ClassDefinition,
  options: { isStartingClass?: boolean } = {},
): ClassSelectionDraft {
  const instance = legacyDraftToInstanceDraft(draft, '__draft__')
  const pruned = pruneClassInstanceChoicesForLevel(instance, definition, level)

  return {
    ...draft,
    level: pruned.level,
    choices: pruned.choices,
    hitPointIncreases: syncHitPointIncreases(draft.hitPointIncreases, pruned.level, {
      isStartingClass: options.isStartingClass ?? true,
    }),
  }
}

export function updateClassDraftHitPointIncrease(
  draft: ClassSelectionDraft,
  classLevel: number,
  patch: Partial<Pick<HitPointIncrease, 'method' | 'rolledValue'>>,
): ClassSelectionDraft {
  const increases =
    draft.hitPointIncreases ??
    syncHitPointIncreases(undefined, draft.level, { isStartingClass: true })

  return {
    ...draft,
    hitPointIncreases: increases.map((entry) => {
      if (entry.classLevel !== classLevel) {
        return entry
      }

      const method = patch.method ?? entry.method
      const next: HitPointIncrease = {
        classLevel: entry.classLevel,
        method,
      }

      if (method === 'roll') {
        const rolledValue =
          patch.rolledValue !== undefined ? patch.rolledValue : entry.rolledValue
        if (rolledValue !== undefined) {
          next.rolledValue = rolledValue
        }
      }

      return next
    }),
  }
}

export function tryCommitClassInstanceDraft(
  draft: CharacterClassSelectionDraft,
  editionId: EditionId,
  definition: ClassDefinition | null,
  options?: ClassValidationOptions & { isStartingClass?: boolean },
): {
  committed: CharacterClassSelection | null
  validation: ClassValidationResult
} {
  const isStartingClass = options?.isStartingClass ?? false
  const instance = {
    ...instanceDraftToClassInstance(draft),
    hitPointIncreases: syncHitPointIncreases(draft.hitPointIncreases, draft.level, {
      isStartingClass,
    }),
  }
  const validation = validateClassInstance(
    instance,
    editionId,
    definition,
    options,
  )

  if (!validation.ok) {
    return { committed: null, validation: toLegacyValidation(validation) }
  }

  return { committed: instance, validation: { ok: true } }
}

export function tryCommitClassDraft(
  draft: ClassSelectionDraft,
  editionId: EditionId,
  definition: ClassDefinition | null,
  options?: ClassValidationOptions,
): {
  committed: ClassSelection | null
  validation: ClassValidationResult
} {
  const selection = {
    ...draftToClassSelection(draft),
    hitPointIncreases: syncHitPointIncreases(draft.hitPointIncreases, draft.level, {
      isStartingClass: true,
    }),
  }
  const validation = validateClassSelection(
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
