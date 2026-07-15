import type { AbilityId } from '../../domain/abilities/types'
import { isEligibleAbilityScore } from '../../domain/background/computeAbilityScoreBonuses'
import type {
  AbilityScoreIncreaseSelection,
  BackgroundChoice,
  BackgroundDefinition,
  BackgroundSelection,
} from '../../domain/background/types'
import type { EditionId } from '../../domain/types'

export type BackgroundValidationIssueCode =
  | 'background-not-found'
  | 'wrong-edition'
  | 'missing-ability-score-increase'
  | 'invalid-ability-score-increase'
  | 'missing-required-choice'
  | 'invalid-choice'
  | 'unknown-choice'

export type BackgroundValidationIssue = {
  code: BackgroundValidationIssueCode
  choiceId?: string
}

export type BackgroundValidationResult =
  | { ok: true }
  | { ok: false; issues: BackgroundValidationIssue[] }

function validateAbilityScoreIncrease(
  definition: BackgroundDefinition,
  increase: AbilityScoreIncreaseSelection | undefined,
): BackgroundValidationIssue[] {
  if (increase === undefined) {
    return [{ code: 'missing-ability-score-increase' }]
  }

  if (increase.mode === 'three-one') {
    return []
  }

  if (
    !isEligibleAbilityScore(definition, increase.plusTwo) ||
    !isEligibleAbilityScore(definition, increase.plusOne)
  ) {
    return [{ code: 'invalid-ability-score-increase' }]
  }

  if (increase.plusTwo === increase.plusOne) {
    return [{ code: 'invalid-ability-score-increase' }]
  }

  return []
}

function validateChoiceValue(
  choice: BackgroundChoice,
  value: string | undefined,
): BackgroundValidationIssue[] {
  if (value === undefined) {
    if (choice.required) {
      return [{ code: 'missing-required-choice', choiceId: choice.id }]
    }

    return []
  }

  const isValidOption = choice.options.some((option) => option.id === value)

  return isValidOption
    ? []
    : [{ code: 'invalid-choice', choiceId: choice.id }]
}

function getRequiredChoiceIds(definition: BackgroundDefinition): string[] {
  const choiceIds = definition.choices.map((choice) => choice.id)

  if (definition.toolProficiency.kind === 'choice') {
    choiceIds.push(definition.toolProficiency.choiceId)
  }

  return choiceIds
}

function getChoiceDefinition(
  definition: BackgroundDefinition,
  choiceId: string,
): BackgroundChoice | null {
  const explicitChoice = definition.choices.find(
    (choice) => choice.id === choiceId,
  )

  if (explicitChoice !== undefined) {
    return explicitChoice
  }

  if (
    definition.toolProficiency.kind === 'choice' &&
    definition.toolProficiency.choiceId === choiceId
  ) {
    return {
      id: definition.toolProficiency.choiceId,
      prompt: definition.toolProficiency.prompt,
      type: 'single-select',
      required: true,
      options: definition.toolProficiency.options,
    }
  }

  return null
}

export function validateBackgroundSelection(
  selection: BackgroundSelection,
  editionId: EditionId,
  definition: BackgroundDefinition | null,
): BackgroundValidationResult {
  if (definition === null) {
    return { ok: false, issues: [{ code: 'background-not-found' }] }
  }

  if (definition.editionId !== editionId) {
    return { ok: false, issues: [{ code: 'wrong-edition' }] }
  }

  const issues: BackgroundValidationIssue[] = [
    ...validateAbilityScoreIncrease(
      definition,
      selection.abilityScoreIncrease,
    ),
  ]

  const requiredChoiceIds = new Set(getRequiredChoiceIds(definition))

  for (const choiceId of requiredChoiceIds) {
    const choice = getChoiceDefinition(definition, choiceId)

    if (choice === null) {
      continue
    }

    issues.push(
      ...validateChoiceValue(choice, selection.choices[choiceId]),
    )
  }

  for (const choiceId of Object.keys(selection.choices)) {
    if (!requiredChoiceIds.has(choiceId)) {
      issues.push({ code: 'unknown-choice', choiceId })
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return { ok: true }
}

export function needsEditionChangeBackgroundConfirmation(
  committedSelection: BackgroundSelection | null,
  nextEditionId: EditionId,
  getBackgroundDefinition: (
    backgroundId: string,
  ) => Promise<BackgroundDefinition | null>,
): Promise<boolean> {
  if (committedSelection === null) {
    return Promise.resolve(false)
  }

  return getBackgroundDefinition(committedSelection.backgroundId).then(
    (definition) => {
      if (definition === null) {
        return true
      }

      return (
        validateBackgroundSelection(
          committedSelection,
          nextEditionId,
          definition,
        ).ok === false
      )
    },
  )
}

export function getBackgroundChoiceIds(
  definition: BackgroundDefinition,
): string[] {
  return getRequiredChoiceIds(definition)
}

export function getBackgroundChoiceDefinition(
  definition: BackgroundDefinition,
  choiceId: string,
): BackgroundChoice | null {
  return getChoiceDefinition(definition, choiceId)
}

export function isValidAbilityScoreIncreaseForDefinition(
  definition: BackgroundDefinition,
  increase: AbilityScoreIncreaseSelection,
): boolean {
  return (
    validateAbilityScoreIncrease(definition, increase).length === 0
  )
}

export function getEligibleAbilityIds(
  definition: BackgroundDefinition,
): AbilityId[] {
  return [...definition.eligibleAbilityScores]
}
