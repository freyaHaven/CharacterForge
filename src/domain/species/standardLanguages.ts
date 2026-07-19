import type {
  SpeciesLanguageGrant,
  SpeciesLanguages,
  SpeciesSelection,
  SpeciesSelectionChoiceValue,
} from './types'

/**
 * Standard Languages pool from SRD 5.2.1 Character Creation.
 * Common is granted separately and is not part of the choose/roll pool.
 */
export const STANDARD_LANGUAGES: readonly SpeciesLanguageGrant[] = [
  { id: 'common-sign', label: 'Common Sign Language' },
  { id: 'draconic', label: 'Draconic' },
  { id: 'dwarvish', label: 'Dwarvish' },
  { id: 'elvish', label: 'Elvish' },
  { id: 'giant', label: 'Giant' },
  { id: 'gnomish', label: 'Gnomish' },
  { id: 'goblin', label: 'Goblin' },
  { id: 'halfling', label: 'Halfling' },
  { id: 'orc', label: 'Orc' },
] as const

export function resolveLanguageChoicePool(
  pool: 'standard' | SpeciesLanguageGrant[],
): readonly SpeciesLanguageGrant[] {
  if (pool === 'standard') {
    return STANDARD_LANGUAGES
  }

  return pool
}

function getSelectedIds(
  value: SpeciesSelectionChoiceValue | undefined,
): string[] {
  if (value === undefined) {
    return []
  }

  return typeof value === 'string' ? [value] : [...value]
}

/**
 * Labels for languages the character currently knows from species grants and
 * completed language choices (e.g. Common + Dwarvish + Elvish).
 */
export function resolveSpeciesKnownLanguageLabels(
  languages: SpeciesLanguages,
  selection: SpeciesSelection | null,
): string[] {
  const labels: string[] = languages.grants.map((grant) => grant.label)
  const seen = new Set(labels.map((label) => label.toLowerCase()))

  for (const choice of languages.choices) {
    const pool = resolveLanguageChoicePool(choice.pool)
    const selectedIds = getSelectedIds(selection?.choices[choice.id])

    for (const id of selectedIds) {
      const label = pool.find((option) => option.id === id)?.label ?? id
      const key = label.toLowerCase()
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      labels.push(label)
    }
  }

  return labels
}
