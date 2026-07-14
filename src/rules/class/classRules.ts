import type {
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import { getChoicesAvailableAtLevel } from '../../domain/class/choiceAvailability'
import type { EditionId } from '../../domain/types'

export type ClassValidationIssueCode =
  | 'class-not-found'
  | 'wrong-edition'
  | 'invalid-level'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'invalid-multi-select-count'
  | 'unknown-choice'

export type ClassValidationIssue = {
  code: ClassValidationIssueCode
  choiceId?: string
}

export type ClassValidationResult =
  | { ok: true }
  | { ok: false; issues: ClassValidationIssue[] }

function getSelectedOptionIds(value: ClassChoiceValue): string[] {
  return typeof value === 'string' ? [value] : [...value]
}

function validateChoiceValue(
  choice: ClassChoice,
  value: ClassChoiceValue | undefined,
): ClassValidationIssue[] {
  if (value === undefined) {
    if (choice.required) {
      return [{ code: 'missing-required-choice', choiceId: choice.id }]
    }

    return []
  }

  if (choice.type === 'single-select') {
    if (typeof value !== 'string') {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    const isValidOption = choice.options.some((option) => option.id === value)

    return isValidOption
      ? []
      : [{ code: 'invalid-choice', choiceId: choice.id }]
  }

  if (!Array.isArray(value)) {
    return [{ code: 'invalid-choice', choiceId: choice.id }]
  }

  if (value.length < choice.min || value.length > choice.max) {
    return [{ code: 'invalid-multi-select-count', choiceId: choice.id }]
  }

  const invalidOption = value.some(
    (optionId) => !choice.options.some((option) => option.id === optionId),
  )

  return invalidOption
    ? [{ code: 'invalid-choice', choiceId: choice.id }]
    : []
}

export function validateClassSelection(
  selection: ClassSelection,
  editionId: EditionId,
  definition: ClassDefinition | null,
): ClassValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'class-not-found' }] }
  }

  if (definition.editionId !== editionId) {
    return { ok: false, issues: [{ code: 'wrong-edition' }] }
  }

  if (
    !Number.isInteger(selection.level) ||
    selection.level < 1 ||
    selection.level > 20
  ) {
    return { ok: false, issues: [{ code: 'invalid-level' }] }
  }

  const issues: ClassValidationIssue[] = []
  const availableChoices = getChoicesAvailableAtLevel(definition, selection.level)
  const availableChoiceIds = new Set(
    availableChoices.map((choice) => choice.id),
  )

  for (const choice of availableChoices) {
    issues.push(
      ...validateChoiceValue(choice, selection.choices[choice.id]),
    )
  }

  for (const choiceId of Object.keys(selection.choices)) {
    if (!availableChoiceIds.has(choiceId)) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true }
}

export function needsEditionChangeClassConfirmation(
  committedSelection: ClassSelection | null,
  nextEditionId: EditionId,
  getClassDefinition: (classId: string) => Promise<ClassDefinition | null>,
): Promise<boolean> {
  if (committedSelection === null) {
    return Promise.resolve(false)
  }

  return getClassDefinition(committedSelection.classId).then((definition) => {
    if (definition === null) {
      return true
    }

    return (
      validateClassSelection(committedSelection, nextEditionId, definition).ok ===
      false
    )
  })
}
