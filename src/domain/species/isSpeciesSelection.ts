import type { SpeciesSelection } from './types'

export function isSpeciesSelection(value: unknown): value is SpeciesSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  if (
    typeof candidate.speciesId !== 'string' ||
    candidate.speciesId.length === 0
  ) {
    return false
  }

  if (typeof candidate.choices !== 'object' || candidate.choices === null) {
    return false
  }

  const choices = candidate.choices as Record<string, unknown>

  return Object.values(choices).every((choice) => typeof choice === 'string')
}
