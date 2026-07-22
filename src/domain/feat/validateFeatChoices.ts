import {
  isCompleteAsiChoiceValue,
  parseAsiChoice,
} from '../class/abilityScoreImprovement'
import type { FeatChoice, FeatDefinition } from './types'
import {
  getSkillOrToolProficiencyOption,
  listSkillOrToolProficiencyOptions,
} from './skillOrToolProficiency'

export type FeatChoiceValidationIssueCode =
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'invalid-multi-select-count'
  | 'duplicate-selection'
  | 'already-proficient'
  | 'unknown-choice'

export type FeatChoiceValidationIssue = {
  code: FeatChoiceValidationIssueCode
  choiceId?: string
}

export type FeatChoiceValidationContext = {
  /** Skill ids already proficient from other sources (exclude this grant). */
  ownedSkillIds?: ReadonlySet<string>
  /** Tool ids already proficient from other sources (exclude this grant). */
  ownedToolIds?: ReadonlySet<string>
  /**
   * When true, already-owned skill/tool picks are invalid (UI disables them).
   * Defaults to true.
   */
  rejectAlreadyOwned?: boolean
}

export function listFeatChoiceOptions(choice: FeatChoice): {
  id: string
  label: string
}[] {
  if (choice.type === 'single-select') {
    return choice.options.map((option) => ({
      id: option.id,
      label: option.label,
    }))
  }

  if (choice.type === 'multi-select') {
    return listSkillOrToolProficiencyOptions().map((option) => ({
      id: option.id,
      label: option.label,
    }))
  }

  // asi-score-increase — options rendered by dedicated ASI UI
  return []
}

function selectedIds(
  value: string | string[] | undefined,
): string[] {
  if (value === undefined) {
    return []
  }
  return typeof value === 'string' ? [value] : value
}

function validateMultiSelectProficiencyChoice(
  choice: Extract<FeatChoice, { type: 'multi-select' }>,
  value: string | string[] | undefined,
  context: FeatChoiceValidationContext | undefined,
): FeatChoiceValidationIssue[] {
  const ids = selectedIds(value)

  if (choice.required && ids.length === 0) {
    return [{ code: 'missing-required-choice', choiceId: choice.id }]
  }

  if (ids.length === 0) {
    return []
  }

  if (ids.length < choice.min || ids.length > choice.max) {
    return [{ code: 'invalid-multi-select-count', choiceId: choice.id }]
  }

  if (new Set(ids).size !== ids.length) {
    return [{ code: 'duplicate-selection', choiceId: choice.id }]
  }

  const rejectAlreadyOwned = context?.rejectAlreadyOwned !== false
  const ownedSkills = context?.ownedSkillIds ?? new Set<string>()
  const ownedTools = context?.ownedToolIds ?? new Set<string>()

  for (const optionId of ids) {
    const option = getSkillOrToolProficiencyOption(optionId)
    if (option === undefined) {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    if (rejectAlreadyOwned) {
      if (option.kind === 'skill' && ownedSkills.has(option.targetId)) {
        return [{ code: 'already-proficient', choiceId: choice.id }]
      }
      if (option.kind === 'tool' && ownedTools.has(option.targetId)) {
        return [{ code: 'already-proficient', choiceId: choice.id }]
      }
    }
  }

  return []
}

function validateAsiScoreIncreaseChoice(
  choice: Extract<FeatChoice, { type: 'asi-score-increase' }>,
  value: string | string[] | undefined,
): FeatChoiceValidationIssue[] {
  if (value === undefined) {
    return choice.required
      ? [{ code: 'missing-required-choice', choiceId: choice.id }]
      : []
  }

  if (typeof value !== 'string') {
    return [{ code: 'invalid-choice', choiceId: choice.id }]
  }

  const parsed = parseAsiChoice(value)
  // Nested ASI feat: only ability modes — never another feat (cycle guard).
  if (
    parsed === null ||
    parsed.kind === 'mode' ||
    parsed.kind === 'feat' ||
    !isCompleteAsiChoiceValue(value)
  ) {
    if (parsed?.kind === 'mode' || value === 'feat') {
      return [{ code: 'missing-required-choice', choiceId: choice.id }]
    }
    return [{ code: 'invalid-choice', choiceId: choice.id }]
  }

  return []
}

export function validateFeatDefinitionChoices(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
  context?: FeatChoiceValidationContext,
): FeatChoiceValidationIssue[] {
  const issues: FeatChoiceValidationIssue[] = []

  for (const choice of definition.choices) {
    const value = choices[choice.id]

    if (choice.type === 'single-select') {
      if (choice.required && value === undefined) {
        issues.push({ code: 'missing-required-choice', choiceId: choice.id })
        continue
      }
      if (value === undefined) {
        continue
      }
      if (typeof value !== 'string') {
        issues.push({ code: 'invalid-choice', choiceId: choice.id })
        continue
      }
      if (!choice.options.some((option) => option.id === value)) {
        issues.push({ code: 'invalid-choice', choiceId: choice.id })
      }
      continue
    }

    if (choice.type === 'multi-select') {
      issues.push(
        ...validateMultiSelectProficiencyChoice(choice, value, context),
      )
      continue
    }

    issues.push(...validateAsiScoreIncreaseChoice(choice, value))
  }

  for (const choiceId of Object.keys(choices)) {
    if (!definition.choices.some((choice) => choice.id === choiceId)) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  return issues
}

export function areFeatDefinitionChoicesComplete(
  definition: FeatDefinition,
  choices: Record<string, string | string[]>,
  context?: FeatChoiceValidationContext,
): boolean {
  const issues = validateFeatDefinitionChoices(definition, choices, context)
  return !issues.some(
    (issue) =>
      issue.code === 'missing-required-choice' ||
      issue.code === 'invalid-multi-select-count',
  )
}

/** True when the feat has any required sub-choices. */
export function featDefinitionHasRequiredChoices(
  definition: FeatDefinition,
): boolean {
  return definition.choices.some((choice) => choice.required)
}
