import type { ClassChoice, ClassChoiceValue, ClassDefinition } from './types'

function collectSelectedOptionIds(
  value: ClassChoiceValue | undefined,
): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return [...value]
  }

  return []
}

function optionIdSet(choice: ClassChoice): Set<string> | null {
  if (choice.type !== 'multi-select' || choice.options.length === 0) {
    return null
  }

  return new Set(choice.options.map((option) => option.id))
}

/** True when two multi-select choices expose the same option id pool. */
export function choiceSharesOptionPool(
  left: ClassChoice,
  right: ClassChoice,
): boolean {
  const leftIds = optionIdSet(left)
  const rightIds = optionIdSet(right)
  if (leftIds === null || rightIds === null || leftIds.size !== rightIds.size) {
    return false
  }

  for (const optionId of leftIds) {
    if (!rightIds.has(optionId)) {
      return false
    }
  }

  return true
}

/**
 * Option ids already selected on other multi-select choices that share this
 * choice's option pool (e.g. Metamagic at levels 2 / 10 / 17).
 */
export function getExcludedSharedPoolOptionIds(
  definition: ClassDefinition,
  choiceId: string,
  choices: Record<string, ClassChoiceValue>,
): string[] {
  const choice = definition.choices.find((entry) => entry.id === choiceId)
  if (choice === undefined || choice.type !== 'multi-select') {
    return []
  }

  const excluded = new Set<string>()

  for (const other of definition.choices) {
    if (other.id === choiceId || !choiceSharesOptionPool(choice, other)) {
      continue
    }

    for (const optionId of collectSelectedOptionIds(choices[other.id])) {
      excluded.add(optionId)
    }
  }

  return [...excluded]
}
