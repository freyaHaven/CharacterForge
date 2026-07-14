import type {
  ClassDefinition,
  ClassSelection,
  ResolvedClassEffect,
} from '../../domain/class/types'

export function resolveClassEffects(
  definition: ClassDefinition,
  selection: ClassSelection,
): ResolvedClassEffect[] {
  const effects: ResolvedClassEffect[] = [
    { kind: 'hit-die', sides: definition.hitDie.sides },
    ...definition.savingThrows.map((ability) => ({
      kind: 'saving-throw-proficiency' as const,
      ability,
    })),
    ...definition.proficiencies.armor.map((category) => ({
      kind: 'armor-proficiency' as const,
      category,
    })),
    ...definition.proficiencies.weapons.map((category) => ({
      kind: 'weapon-proficiency' as const,
      category,
    })),
  ]

  for (const choice of definition.choices) {
    const value = selection.choices[choice.id]

    if (value === undefined) {
      continue
    }

    const selectedOptionIds =
      typeof value === 'string' ? [value] : [...value]

    for (const optionId of selectedOptionIds) {
      const option = choice.options.find((candidate) => candidate.id === optionId)

      if (option?.effects !== undefined) {
        effects.push(...option.effects)
      }
    }
  }

  return effects
}
