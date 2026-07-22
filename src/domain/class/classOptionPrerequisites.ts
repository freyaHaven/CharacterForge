import type {
  ClassChoice,
  ClassChoiceOption,
  ClassChoiceValue,
  ClassOptionPrerequisite,
} from './types'

export type ClassOptionEligibilityContext = {
  /** Class instance level used for min-source-level checks. */
  sourceLevel: number
  /** Current choice map (may include the multi-select being edited). */
  selectedChoices: Record<string, ClassChoiceValue>
}

/**
 * True when `selectedId` satisfies a required option id.
 * Accepts exact match or numbered repeats (`pact-of-the-blade-2`).
 */
export function matchesRequiredOptionId(
  selectedId: string,
  requiredOptionId: string,
): boolean {
  return (
    selectedId === requiredOptionId ||
    selectedId.startsWith(`${requiredOptionId}-`)
  )
}

function selectedIdsForChoice(
  selectedChoices: Record<string, ClassChoiceValue>,
  choiceId: string,
): string[] {
  const value = selectedChoices[choiceId]
  if (value === undefined) {
    return []
  }
  return typeof value === 'string' ? [value] : [...value]
}

export function formatClassOptionPrerequisiteReason(
  prerequisite: ClassOptionPrerequisite,
): string {
  if (prerequisite.kind === 'min-source-level') {
    return `Requires level ${prerequisite.level}+`
  }

  return `Requires ${prerequisite.optionId.replace(/-/g, ' ')}`
}

export function isClassChoiceOptionEligible(
  option: ClassChoiceOption,
  ctx: ClassOptionEligibilityContext,
): boolean {
  for (const prerequisite of option.prerequisites ?? []) {
    if (prerequisite.kind === 'min-source-level') {
      if (ctx.sourceLevel < prerequisite.level) {
        return false
      }
      continue
    }

    const selected = selectedIdsForChoice(
      ctx.selectedChoices,
      prerequisite.choiceId,
    )
    const satisfied = selected.some((id) =>
      matchesRequiredOptionId(id, prerequisite.optionId),
    )
    if (!satisfied) {
      return false
    }
  }

  return true
}

export type IneligibleClassChoiceOption = {
  optionId: string
  reason: string
}

/**
 * Option ids that fail prerequisites for the given choice at the current level.
 * Used by UI (disabled + reason) and validation.
 */
export function getIneligibleClassChoiceOptionIds(
  choice: ClassChoice,
  ctx: ClassOptionEligibilityContext,
): IneligibleClassChoiceOption[] {
  const ineligible: IneligibleClassChoiceOption[] = []

  for (const option of choice.options) {
    if (isClassChoiceOptionEligible(option, ctx)) {
      continue
    }

    const failed = (option.prerequisites ?? []).find((prerequisite) => {
      if (prerequisite.kind === 'min-source-level') {
        return ctx.sourceLevel < prerequisite.level
      }
      const selected = selectedIdsForChoice(
        ctx.selectedChoices,
        prerequisite.choiceId,
      )
      return !selected.some((id) =>
        matchesRequiredOptionId(id, prerequisite.optionId),
      )
    })

    ineligible.push({
      optionId: option.id,
      reason:
        failed !== undefined
          ? formatClassOptionPrerequisiteReason(failed)
          : 'Prerequisites not met',
    })
  }

  return ineligible
}

/**
 * Drop selected multi-select options that are no longer eligible, and any
 * options that depended on a removed selection (cascade).
 */
export function pruneIneligibleMultiSelectOptions(
  choice: Extract<ClassChoice, { type: 'multi-select' }>,
  selected: string[],
  sourceLevel: number,
  selectedChoices: Record<string, ClassChoiceValue>,
): string[] {
  let current = [...selected]
  let changed = true

  while (changed) {
    changed = false
    const ctx: ClassOptionEligibilityContext = {
      sourceLevel,
      selectedChoices: {
        ...selectedChoices,
        [choice.id]: current,
      },
    }

    const next = current.filter((optionId) => {
      const option = choice.options.find((entry) => entry.id === optionId)
      if (option === undefined) {
        return false
      }
      return isClassChoiceOptionEligible(option, ctx)
    })

    if (next.length !== current.length) {
      current = next
      changed = true
    }
  }

  return current
}
