import type {
  CharacterClassSelection,
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import type { EditionId } from '../../domain/types'

export type ClassValidationIssueCode =
  | 'class-not-found'
  | 'wrong-edition'
  | 'invalid-level'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'invalid-multi-select-count'
  | 'unknown-choice'
  | 'duplicate-instance-id'
  | 'duplicate-class-id'
  | 'allocation-exceeds-target'
  | 'invalid-starting-class-reference'

export type ClassValidationIssue = {
  code: ClassValidationIssueCode
  choiceId?: string
}

export type ClassValidationResult =
  | { ok: true }
  | { ok: false; issues: ClassValidationIssue[] }

export type ClassInstanceValidationError = {
  sourceInstanceId: string
  sourceClassId: string
  code: ClassValidationIssueCode
  choiceId?: string
  message: string
}

export type ClassInstanceValidationResult =
  | { ok: true }
  | { ok: false; errors: ClassInstanceValidationError[] }

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

function formatValidationMessage(issue: ClassValidationIssue): string {
  switch (issue.code) {
    case 'class-not-found':
      return 'The selected class could not be found.'
    case 'wrong-edition':
      return 'The selected class is not available for the current rules edition.'
    case 'invalid-level':
      return 'Choose a valid class level between 1 and 20.'
    case 'missing-required-choice':
      if (issue.choiceId === 'fighting-style') {
        return 'Choose a Fighting Style.'
      }
      if (issue.choiceId === 'skill-proficiencies') {
        return 'Choose two skill proficiencies.'
      }
      return `Choose an option for ${issue.choiceId ?? 'a required class choice'}.`
    case 'invalid-choice':
      return `The selected option for ${issue.choiceId ?? 'a class choice'} is invalid.`
    case 'invalid-multi-select-count':
      if (issue.choiceId === 'skill-proficiencies') {
        return 'Choose exactly two skill proficiencies.'
      }
      return `Choose the required number of options for ${issue.choiceId ?? 'a class choice'}.`
    case 'unknown-choice':
      return `Remove the unknown choice ${issue.choiceId ?? 'entry'}.`
    case 'duplicate-instance-id':
      return 'Each class instance must have a unique instance id.'
    case 'duplicate-class-id':
      return 'Each class may only be selected once.'
    case 'allocation-exceeds-target':
      return 'Allocated class levels exceed the target character level.'
    case 'invalid-starting-class-reference':
      return 'The starting class reference is invalid.'
  }
}

function toInstanceErrors(
  instance: CharacterClassSelection,
  issues: ClassValidationIssue[],
): ClassInstanceValidationError[] {
  return issues.map((issue) => ({
    sourceInstanceId: instance.instanceId,
    sourceClassId: instance.classId,
    code: issue.code,
    choiceId: issue.choiceId,
    message: formatValidationMessage(issue),
  }))
}

export function validateClassInstance(
  instance: CharacterClassSelection,
  editionId: EditionId,
  definition: ClassDefinition | null,
): ClassInstanceValidationResult {
  if (definition === null) {
    return {
      ok: false,
      errors: toInstanceErrors(instance, [{ code: 'class-not-found' }]),
    }
  }

  if (definition.editionId !== editionId) {
    return {
      ok: false,
      errors: toInstanceErrors(instance, [{ code: 'wrong-edition' }]),
    }
  }

  if (
    !Number.isInteger(instance.level) ||
    instance.level < 1 ||
    instance.level > 20
  ) {
    return {
      ok: false,
      errors: toInstanceErrors(instance, [{ code: 'invalid-level' }]),
    }
  }

  const issues: ClassValidationIssue[] = []
  const availableChoices = definition.choices.filter(
    (choice) => choice.level <= instance.level,
  )
  const availableChoiceIds = new Set(
    availableChoices.map((choice) => choice.id),
  )

  for (const choice of availableChoices) {
    issues.push(
      ...validateChoiceValue(choice, instance.choices[choice.id]),
    )
  }

  for (const choiceId of Object.keys(instance.choices)) {
    if (!availableChoiceIds.has(choiceId)) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  if (issues.length > 0) {
    return { ok: false, errors: toInstanceErrors(instance, issues) }
  }

  return { ok: true }
}

export function validateClassSelection(
  selection: ClassSelection,
  editionId: EditionId,
  definition: ClassDefinition | null,
): ClassValidationResult {
  const instance: CharacterClassSelection = {
    instanceId: '__legacy__',
    classId: selection.classId,
    level: selection.level,
    choices: selection.choices,
  }
  const result = validateClassInstance(instance, editionId, definition)

  if (result.ok) {
    return { ok: true }
  }

  return {
    ok: false,
    issues: result.errors.map((error) => ({
      code: error.code,
      choiceId: error.choiceId,
    })),
  }
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
