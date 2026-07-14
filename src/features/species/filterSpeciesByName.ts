import type { SpeciesDefinition } from '../../domain/species/types'

export function filterSpeciesByName(
  species: SpeciesDefinition[],
  query: string,
): SpeciesDefinition[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return species
  }

  return species.filter((entry) =>
    entry.name.toLowerCase().includes(normalizedQuery),
  )
}
