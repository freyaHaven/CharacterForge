/**
 * Shared capability-overlap model.
 *
 * Compares what an option grants against what the character already has,
 * without hardcoding class, feat, or spell names.
 */

export type CapabilityKind =
  | 'spell'
  | 'spell-list-access'
  | 'skill-proficiency'
  | 'tool-proficiency'
  | 'language'
  | 'damage-resistance'
  | 'sense'
  | 'initiative-proficiency'
  | 'armor-class-bonus'
  | 'feat'

export type CapabilitySourceRef = {
  /** Player-facing provenance (e.g. group / grant label). */
  label: string
  /** Machine-readable origin kind when available. */
  kind?: string
  id?: string
}

/** One capability the character already possesses. */
export type CapabilityToken = {
  kind: CapabilityKind
  id: string
  source: CapabilitySourceRef
  how?: 'selected' | 'granted' | 'fixed'
}

/**
 * What selecting an option would grant.
 * Derived from content definitions — never from display prose.
 */
export type OptionGrant =
  | {
      kind: 'fixed'
      capability: { kind: CapabilityKind; id: string }
    }
  | {
      /** Picks from a spell list (cantrips / known / prepared). */
      kind: 'spell-list-picks'
      listId: string
      selectionKind: string
    }
  | {
      /** Feat (or similar) that grants access to cast from a spell list. */
      kind: 'spell-list-access'
      listId: string
    }

export type OverlapStatus = 'recommended' | 'redundant' | 'unavailable'

export type OverlapReason = {
  code: string
  message: string
  sources: CapabilitySourceRef[]
}

export type OverlapVerdict = {
  status: OverlapStatus
  reasons: OverlapReason[]
}

export type CharacterCapabilityInventory = {
  tokens: CapabilityToken[]
}

export function emptyCapabilityInventory(): CharacterCapabilityInventory {
  return { tokens: [] }
}

export function findCapabilityTokens(
  inventory: CharacterCapabilityInventory,
  kind: CapabilityKind,
  id: string,
): CapabilityToken[] {
  return inventory.tokens.filter(
    (token) => token.kind === kind && token.id === id,
  )
}

export function hasCapability(
  inventory: CharacterCapabilityInventory,
  kind: CapabilityKind,
  id: string,
): boolean {
  return findCapabilityTokens(inventory, kind, id).length > 0
}
