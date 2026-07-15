import type { FeatDefinition } from '../../domain/feat/types'

export function filterFeatsByName(
  feats: FeatDefinition[],
  query: string,
): FeatDefinition[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return feats
  }

  return feats.filter(
    (entry) =>
      entry.name.toLowerCase().includes(normalizedQuery) ||
      entry.summary.toLowerCase().includes(normalizedQuery) ||
      entry.category.toLowerCase().includes(normalizedQuery),
  )
}
