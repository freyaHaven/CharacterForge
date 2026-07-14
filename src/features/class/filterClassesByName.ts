import type { ClassDefinition } from '../../domain/class/types'

export function filterClassesByName(
  classes: ClassDefinition[],
  query: string,
): ClassDefinition[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (normalizedQuery.length === 0) {
    return classes
  }

  return classes.filter((entry) =>
    entry.name.toLowerCase().includes(normalizedQuery),
  )
}
