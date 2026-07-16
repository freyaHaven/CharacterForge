import type { SpeciesDefinition } from '../../domain/species/types'
import type {
  SpeciesEffect,
  SpeciesSelection,
} from '../../domain/species/types'

export function resolveSpeciesEffects(
  definition: SpeciesDefinition,
  selection: SpeciesSelection,
): SpeciesEffect[] {
  const effects: SpeciesEffect[] = [...definition.effects]

  for (const trait of definition.traits) {
    if (trait.effects !== undefined) {
      effects.push(...trait.effects)
    }
  }

  for (const choice of definition.choices) {
    const selectedOptionId = selection.choices[choice.id]

    if (typeof selectedOptionId !== 'string') {
      continue
    }

    const option = choice.options.find(
      (candidate) => candidate.id === selectedOptionId,
    )

    if (option?.effects !== undefined) {
      effects.push(...option.effects)
    }
  }

  return effects
}
