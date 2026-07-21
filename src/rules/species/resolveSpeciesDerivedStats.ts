import type {
  CreatureSize,
  SpeciesDefinition,
  SpeciesSelection,
} from '../../domain/species/types'
import { resolveSpeciesEffects } from './resolveSpeciesEffects'

export function resolveSpeciesWalkSpeed(
  definition: SpeciesDefinition,
  selection: SpeciesSelection,
): number {
  const effects = resolveSpeciesEffects(definition, selection)
  let walk = definition.speed.walk

  for (const effect of effects) {
    if (effect.kind === 'speed-walk') {
      walk = effect.feet
    }
  }

  return walk
}

export function resolveSpeciesSize(
  definition: SpeciesDefinition,
  selection: SpeciesSelection,
): CreatureSize {
  const effects = resolveSpeciesEffects(definition, selection)
  let size = definition.size

  for (const effect of effects) {
    if (effect.kind === 'size') {
      size = effect.size
    }
  }

  return size
}
