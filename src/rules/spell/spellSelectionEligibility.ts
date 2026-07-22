import type {
  CrossSourceDuplicatePolicy,
  SpellSelectionKind,
} from '../../domain/spell/types'
import type {
  CharacterSpellcastingSummary,
  ResolvedSpellEntitlement,
  ResolvedSpellSourceGroup,
} from '../character/resolveCharacterSpellcasting'

export type SpellAvailabilityHow = 'selected' | 'granted'

export type SpellAvailabilityOrigin = {
  groupId: string
  groupLabel: string
  entitlementId: string
  entitlementLabel: string
  how: SpellAvailabilityHow
  selectionKind?: SpellSelectionKind
}

export type SpellSelectionEligibility = {
  spellId: string
  alreadyAvailableFromOtherSource: boolean
  duplicateWithinCurrentSource: boolean
  /** Already selected or granted on this entitlement. */
  ownedByCurrentEntitlement: boolean
  duplicateReason: string | null
  otherSourceOrigins: SpellAvailabilityOrigin[]
  currentSourceOrigins: SpellAvailabilityOrigin[]
  policy: CrossSourceDuplicatePolicy
  /**
   * Whether the player may toggle this spell on for this entitlement.
   * Already-selected spells stay selectable so they can be cleared.
   */
  canSelect: boolean
  recommendation: 'normal' | 'discouraged' | 'blocked'
}

const DEFAULT_POLICY: CrossSourceDuplicatePolicy = 'discourage'

/**
 * Default policy when content does not declare one.
 * Cantrips default to forbid — learning the same cantrip twice is never useful.
 * Known/prepared default to discourage — duplicates can be intentional.
 */
export function defaultCrossSourceDuplicatePolicy(
  selectionKind: SpellSelectionKind | undefined,
): CrossSourceDuplicatePolicy {
  if (selectionKind === 'cantrip') {
    return 'forbid'
  }
  return DEFAULT_POLICY
}

function resolvePolicy(
  entitlement: ResolvedSpellEntitlement,
): CrossSourceDuplicatePolicy {
  return (
    entitlement.crossSourceDuplicatePolicy ??
    defaultCrossSourceDuplicatePolicy(entitlement.selectionKind)
  )
}

/**
 * Index every spell currently available from resolved spellcasting sources.
 * Uses select entitlements after grant-folding so always-prepared spells are included once.
 */
export function collectSpellAvailability(
  summary: CharacterSpellcastingSummary,
): Map<string, SpellAvailabilityOrigin[]> {
  const bySpellId = new Map<string, SpellAvailabilityOrigin[]>()

  function add(spellId: string, origin: SpellAvailabilityOrigin) {
    const existing = bySpellId.get(spellId) ?? []
    const duplicate = existing.some(
      (entry) =>
        entry.groupId === origin.groupId &&
        entry.entitlementId === origin.entitlementId &&
        entry.how === origin.how,
    )
    if (duplicate) {
      return
    }
    existing.push(origin)
    bySpellId.set(spellId, existing)
  }

  for (const group of summary.groups) {
    for (const entitlement of group.entitlements) {
      if (entitlement.kind !== 'select') {
        continue
      }

      // Spellbook entries are recorded, not castable — skip availability index.
      if (entitlement.selectionKind === 'spellbook') {
        continue
      }

      for (const spellId of entitlement.selectedSpellIds) {
        add(spellId, {
          groupId: group.groupId,
          groupLabel: group.label,
          entitlementId: entitlement.entitlementId,
          entitlementLabel: entitlement.label,
          how: 'selected',
          selectionKind: entitlement.selectionKind,
        })
      }

      for (const grant of entitlement.grantedSpells) {
        add(grant.spellId, {
          groupId: group.groupId,
          groupLabel: group.label,
          entitlementId: grant.entitlementId,
          entitlementLabel: grant.label,
          how: 'granted',
          selectionKind: entitlement.selectionKind,
        })
      }
    }
  }

  return bySpellId
}

function formatOrigin(origin: SpellAvailabilityOrigin): string {
  const how =
    origin.how === 'granted' ? 'always prepared' : origin.entitlementLabel
  if (origin.how === 'granted') {
    return `${origin.groupLabel} (${how})`
  }
  return `${origin.groupLabel} — ${how}`
}

function buildDuplicateReason(
  otherSourceOrigins: SpellAvailabilityOrigin[],
  currentSourceOrigins: SpellAvailabilityOrigin[],
): string | null {
  const parts: string[] = []
  if (otherSourceOrigins.length > 0) {
    parts.push(
      `Already known from: ${otherSourceOrigins.map(formatOrigin).join('; ')}`,
    )
  }
  if (currentSourceOrigins.length > 0) {
    parts.push(
      `Already known from: ${currentSourceOrigins.map(formatOrigin).join('; ')}`,
    )
  }
  if (parts.length === 0) {
    return null
  }
  return parts.join('. ')
}

export function evaluateSpellSelectionEligibility(input: {
  spellId: string
  summary: CharacterSpellcastingSummary
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  availability?: Map<string, SpellAvailabilityOrigin[]>
}): SpellSelectionEligibility {
  const availability =
    input.availability ?? collectSpellAvailability(input.summary)
  const origins = availability.get(input.spellId) ?? []
  const policy = resolvePolicy(input.entitlement)

  const ownedByCurrentEntitlement = origins.some(
    (origin) =>
      origin.groupId === input.group.groupId &&
      origin.entitlementId === input.entitlement.entitlementId,
  )

  const currentSourceOrigins = origins.filter(
    (origin) =>
      origin.groupId === input.group.groupId &&
      origin.entitlementId !== input.entitlement.entitlementId,
  )

  const otherSourceOrigins = origins.filter(
    (origin) => origin.groupId !== input.group.groupId,
  )

  const alreadyAvailableFromOtherSource = otherSourceOrigins.length > 0
  const duplicateWithinCurrentSource = currentSourceOrigins.length > 0
  const hasExternalDuplicate =
    alreadyAvailableFromOtherSource || duplicateWithinCurrentSource

  const duplicateReason = hasExternalDuplicate
    ? buildDuplicateReason(otherSourceOrigins, currentSourceOrigins)
    : null

  const alreadySelectedHere = input.entitlement.selectedSpellIds.includes(
    input.spellId,
  )

  let recommendation: SpellSelectionEligibility['recommendation'] = 'normal'
  let canSelect = true

  if (hasExternalDuplicate && !alreadySelectedHere) {
    if (policy === 'forbid') {
      recommendation = 'blocked'
      canSelect = false
    } else if (policy === 'discourage') {
      recommendation = 'discouraged'
      canSelect = true
    }
  }

  // Soft-invalid: keep an existing forbidden duplicate selectable so it can be cleared.
  if (hasExternalDuplicate && alreadySelectedHere && policy === 'forbid') {
    recommendation = 'blocked'
    canSelect = true
  }

  return {
    spellId: input.spellId,
    alreadyAvailableFromOtherSource,
    duplicateWithinCurrentSource,
    ownedByCurrentEntitlement,
    duplicateReason,
    otherSourceOrigins,
    currentSourceOrigins,
    policy,
    canSelect,
    recommendation,
  }
}

/**
 * Evaluate eligibility for every catalogue spell under one entitlement.
 */
export function evaluateSpellCatalogueEligibility(input: {
  summary: CharacterSpellcastingSummary
  group: ResolvedSpellSourceGroup
  entitlement: ResolvedSpellEntitlement
  spellIds: readonly string[]
}): Map<string, SpellSelectionEligibility> {
  const availability = collectSpellAvailability(input.summary)
  const result = new Map<string, SpellSelectionEligibility>()
  for (const spellId of input.spellIds) {
    result.set(
      spellId,
      evaluateSpellSelectionEligibility({
        spellId,
        summary: input.summary,
        group: input.group,
        entitlement: input.entitlement,
        availability,
      }),
    )
  }
  return result
}
