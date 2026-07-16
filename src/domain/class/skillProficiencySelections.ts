import type { ClassChoice, ClassChoiceValue, ClassDefinition } from './types'

export function choiceGrantsSkillProficiency(choice: ClassChoice): boolean {
  return choice.options.some((option) =>
    option.effects?.some((effect) => effect.kind === 'skill-proficiency'),
  )
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

    const value = choices[choice.id]
    if (typeof value === 'string') {
      selected.push(value)
      continue
    }

    if (Array.isArray(value)) {
      selected.push(...value)
    }
  }

  return selected
}
