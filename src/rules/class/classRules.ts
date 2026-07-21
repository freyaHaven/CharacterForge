import type {
  CharacterClassSelection,
  ClassChoice,
  ClassChoiceValue,
  ClassDefinition,
  ClassSelection,
} from '../../domain/class/types'
import {
  isAbilityScoreImprovementChoiceId,
  validateAsiEncodedValue,
  type AsiFeatValidationContext,
} from '../../domain/class/abilityScoreImprovement'
import {
  isCompleteEpicBoonChoiceValue,
  isEpicBoonChoiceId,
  isFeatExcludedFromFeatGrantPickers,
  getEpicBoonFeatIdFromChoiceValue,
} from '../../domain/class/epicBoon'
import { withLevelAdjustedChoiceLimits } from '../../domain/class/weaponMastery'
import {
  collectWeaponMasterySelections,
  isWeaponMasteryChoiceId,
} from '../../domain/class/weaponMastery'
import type { EditionId } from '../../domain/types'
import type { FeatDefinition } from '../../domain/feat/types'
import type { FeatEligibilityContext } from '../../domain/feat/eligibility'
import { evaluateFeatEligibility } from '../../domain/feat/eligibility'
import { collectClassFeatGrantIds } from '../character/resolveCharacterFeatGrants'

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

export type ClassValidationOptions = {
  featById?: ReadonlyMap<string, FeatDefinition>
  /**
   * Legacy character.feat id — kept for compatibility.
   * Prefer takenFeatIds from resolveCharacterFeatGrants when available.
   */
  characterFeatId?: string | null
  /** Feat ids already granted outside the choice being validated. */
  takenFeatIds?: readonly string[]
  /** Shared eligibility context (spellcasting, level, abilities, etc.). */
  eligibilityContext?: FeatEligibilityContext
}

function buildFeatValidationContext(
  allChoices: Record<string, ClassChoiceValue>,
  choiceId: string,
  options?: ClassValidationOptions,
): AsiFeatValidationContext | undefined {
  if (options?.featById === undefined) {
    return undefined
  }

  const takenFeatIds = [
    ...collectClassFeatGrantIds(allChoices, choiceId),
    ...(options.takenFeatIds ?? []),
    ...(options.characterFeatId ? [options.characterFeatId] : []),
  ]

  const eligibilityContext: FeatEligibilityContext = {
    characterLevel: options.eligibilityContext?.characterLevel ?? 20,
    abilityScores: options.eligibilityContext?.abilityScores ?? {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hasSpellcasting: options.eligibilityContext?.hasSpellcasting ?? true,
    hasFightingStyle: options.eligibilityContext?.hasFightingStyle ?? true,
    takenFeatIds,
  }

  return {
    featById: options.featById,
    takenFeatIds,
    evaluateEligibility: (definition) =>
      evaluateFeatEligibility(definition, eligibilityContext),
  }
}

function validateChoiceValue(
  choice: ClassChoice,
  value: ClassChoiceValue | undefined,
  allChoices: Record<string, ClassChoiceValue>,
  options?: ClassValidationOptions,
): ClassValidationIssue[] {
  if (isAbilityScoreImprovementChoiceId(choice.id)) {
    if (value === undefined) {
      return choice.required
        ? [{ code: 'missing-required-choice', choiceId: choice.id }]
        : []
    }

    if (typeof value !== 'string') {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    const featContext = buildFeatValidationContext(
      allChoices,
      choice.id,
      options,
    )
    const result = validateAsiEncodedValue(value, featContext)

    if (result.ok) {
      return []
    }

    if (result.reason === 'incomplete' || result.reason === 'missing') {
      return [{ code: 'missing-required-choice', choiceId: choice.id }]
    }

    return [{ code: 'invalid-choice', choiceId: choice.id }]
  }

  if (isEpicBoonChoiceId(choice.id)) {
    if (value === undefined) {
      return choice.required
        ? [{ code: 'missing-required-choice', choiceId: choice.id }]
        : []
    }

    if (typeof value !== 'string' || !isCompleteEpicBoonChoiceValue(value)) {
      return typeof value === 'string' && value.length > 0
        ? [{ code: 'invalid-choice', choiceId: choice.id }]
        : [{ code: 'missing-required-choice', choiceId: choice.id }]
    }

    const featId = getEpicBoonFeatIdFromChoiceValue(value)
    if (featId === null || isFeatExcludedFromFeatGrantPickers(featId)) {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    const featContext = buildFeatValidationContext(
      allChoices,
      choice.id,
      options,
    )
    if (featContext === undefined) {
      return []
    }

    const definition = featContext.featById.get(featId)
    if (definition === undefined) {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    if (!featContext.evaluateEligibility?.(definition).eligible) {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    const priorTakes = featContext.takenFeatIds.filter(
      (id) => id === featId,
    ).length
    if (priorTakes > 0 && !definition.repeatable) {
      return [{ code: 'invalid-choice', choiceId: choice.id }]
    }

    return []
  }

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
      if (isWeaponMasteryChoiceId(issue.choiceId ?? '')) {
        return 'Choose your Weapon Masteries.'
      }
      if (isAbilityScoreImprovementChoiceId(issue.choiceId ?? '')) {
        return 'Complete your Ability Score Improvement.'
      }
      if (isEpicBoonChoiceId(issue.choiceId ?? '')) {
        return 'Choose an Epic Boon or qualifying feat.'
      }
      return `Choose an option for ${issue.choiceId ?? 'a required class choice'}.`
    case 'invalid-choice':
      if (isAbilityScoreImprovementChoiceId(issue.choiceId ?? '')) {
        return 'The Ability Score Improvement selection is invalid.'
      }
      if (isEpicBoonChoiceId(issue.choiceId ?? '')) {
        return 'The Epic Boon selection is invalid.'
      }
      return `The selected option for ${issue.choiceId ?? 'a class choice'} is invalid.`
    case 'invalid-multi-select-count':
      if (issue.choiceId === 'skill-proficiencies') {
        return 'Choose exactly two skill proficiencies.'
      }
      if (isWeaponMasteryChoiceId(issue.choiceId ?? '')) {
        return 'Choose the required number of Weapon Masteries.'
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
  options?: ClassValidationOptions,
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
  const availableChoices = definition.choices
    .filter((choice) => choice.level <= instance.level)
    .map((choice) => withLevelAdjustedChoiceLimits(choice, instance.level))
  const availableChoiceIds = new Set(
    availableChoices.map((choice) => choice.id),
  )

  for (const choice of availableChoices) {
    issues.push(
      ...validateChoiceValue(
        choice,
        instance.choices[choice.id],
        instance.choices,
        options,
      ),
    )
  }

  const masterySelections = collectWeaponMasterySelections(instance.choices)
  if (new Set(masterySelections).size !== masterySelections.length) {
    const firstDuplicateChoice = availableChoices.find(
      (choice) =>
        isWeaponMasteryChoiceId(choice.id) &&
        Array.isArray(instance.choices[choice.id]) &&
        (instance.choices[choice.id] as string[]).some(
          (weaponId, index, all) => all.indexOf(weaponId) !== index,
        ),
    )

    // Prefer flagging a cross-choice duplicate on an additional mastery row.
    const conflictingChoice =
      availableChoices.find((choice) => {
        if (!isWeaponMasteryChoiceId(choice.id) || choice.id === 'weapon-mastery') {
          return false
        }

        const value = instance.choices[choice.id]
        if (!Array.isArray(value)) {
          return false
        }

        const others = collectWeaponMasterySelections(
          instance.choices,
          choice.id,
        )
        return value.some((weaponId) => others.includes(weaponId))
      }) ?? firstDuplicateChoice

    if (conflictingChoice !== undefined) {
      issues.push({ code: 'invalid-choice', choiceId: conflictingChoice.id })
    }
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
  options?: ClassValidationOptions,
): ClassValidationResult {
  const instance: CharacterClassSelection = {
    instanceId: '__legacy__',
    classId: selection.classId,
    level: selection.level,
    choices: selection.choices,
  }
  const result = validateClassInstance(instance, editionId, definition, options)

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
