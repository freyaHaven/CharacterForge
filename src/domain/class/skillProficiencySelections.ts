import type { ClassChoice, ClassChoiceValue, ClassDefinition } from './types'

export function choiceGrantsSkillProficiency(choice: ClassChoice): boolean {
  return choice.options.some((option) =>
    option.effects?.some((effect) => effect.kind === 'skill-proficiency'),
  )
}

export function choiceGrantsSkillExpertise(choice: ClassChoice): boolean {
  return choice.options.some((option) =>
    option.effects?.some((effect) => effect.kind === 'skill-expertise'),
  )
}

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

/** Collect skill ids already selected on skill-proficiency class choices. */
export function collectSkillProficiencySelections(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
  exceptChoiceId?: string,
): string[] {
  const selected: string[] = []

  for (const choice of definition.choices) {
    if (choice.id === exceptChoiceId || !choiceGrantsSkillProficiency(choice)) {
      continue
    }

    selected.push(...collectSelectedOptionIds(choices[choice.id]))
  }

  return selected
}

/** Collect skill ids already selected on skill-expertise class choices. */
export function collectSkillExpertiseSelections(
  definition: ClassDefinition,
  choices: Record<string, ClassChoiceValue>,
  exceptChoiceId?: string,
): string[] {
  const selected: string[] = []

  for (const choice of definition.choices) {
    if (choice.id === exceptChoiceId || !choiceGrantsSkillExpertise(choice)) {
      continue
    }

    selected.push(...collectSelectedOptionIds(choices[choice.id]))
  }

  return selected
}

/**
 * Option ids to hide on an Expertise multi-select: skills without proficiency,
 * plus skills already given Expertise on another choice.
 */
export function getExcludedExpertiseOptionIds(
  definition: ClassDefinition,
  choiceId: string,
  choices: Record<string, ClassChoiceValue>,
): string[] {
  const choice = definition.choices.find((entry) => entry.id === choiceId)
  if (choice === undefined || !choiceGrantsSkillExpertise(choice)) {
    return []
  }

  const proficient = new Set(
    collectSkillProficiencySelections(definition, choices),
  )
  const otherExpertise = new Set(
    collectSkillExpertiseSelections(definition, choices, choiceId),
  )

  return choice.options
    .map((option) => option.id)
    .filter(
      (optionId) =>
        !proficient.has(optionId) || otherExpertise.has(optionId),
    )
}
