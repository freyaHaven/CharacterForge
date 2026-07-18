import type { SpellSelection, SpellSourceRef, SpellSourceState } from './types'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

export function isSpellSourceRef(value: unknown): value is SpellSourceRef {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  switch (candidate.kind) {
    case 'class-instance':
      return (
        isNonEmptyString(candidate.instanceId) &&
        isNonEmptyString(candidate.entitlementId)
      )
    case 'feat':
      return (
        candidate.slot === 'character-feat' &&
        isNonEmptyString(candidate.featId) &&
        isNonEmptyString(candidate.entitlementId)
      )
    case 'background-origin':
      return (
        isNonEmptyString(candidate.backgroundId) &&
        isNonEmptyString(candidate.entitlementId)
      )
    case 'species-trait':
      return (
        isNonEmptyString(candidate.speciesId) &&
        isNonEmptyString(candidate.traitId) &&
        isNonEmptyString(candidate.entitlementId)
      )
    default:
      return false
  }
}

export function isSpellSelection(value: unknown): value is SpellSelection {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return isNonEmptyString(candidate.spellId)
}

export function isSpellSourceState(value: unknown): value is SpellSourceState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    isSpellSourceRef(candidate.source) &&
    Array.isArray(candidate.selections) &&
    candidate.selections.every(isSpellSelection)
  )
}

export function isSpellSourceStateArray(
  value: unknown,
): value is SpellSourceState[] {
  return Array.isArray(value) && value.every(isSpellSourceState)
}
