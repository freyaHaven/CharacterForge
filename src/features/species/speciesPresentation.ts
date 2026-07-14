import type { SpeciesDefinition } from '../../domain/species/types'

export function getSpeciesCardSummary(species: SpeciesDefinition): string {
  const trimmed = species.description.trim()
  const firstSentence =
    trimmed.match(/^[^.!?]+[.!?]/)?.[0]?.trim() ??
    trimmed.match(/^[^.!?]+/)?.[0]?.trim() ??
    trimmed

  if (firstSentence.length <= 96) {
    return firstSentence
  }

  return `${firstSentence.slice(0, 93).trimEnd()}…`
}
