import type { SpeciesLanguageGrant } from './types'

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
