import type { FeatCategory, FeatDefinition } from './types'
import {
  evaluateFeatEligibility,
  type FeatEligibility,
  type FeatEligibilityContext,
} from './eligibility'
import { deriveFeatOptionGrants } from '../capability/deriveFeatOptionGrants'
import { evaluateOptionOverlap } from '../capability/evaluateOptionOverlap'
import type {
  CharacterCapabilityInventory,
  OverlapVerdict,
} from '../capability/types'
import { emptyCapabilityInventory } from '../capability/types'

/**
 * Why a feat is being offered — entitlement category, not UI chrome.
 * A feat may be legal for the character generally but invalid for this slot.
 */
export type FeatEntitlementPolicy =
  | {
      /** Any feat that passes character eligibility (ASI / Epic Boon / optional Feats step). */
      kind: 'any-qualifying'
    }
  | {
      /** Only feats in one category (Origin, Fighting Style, catalogue grant). */
      kind: 'category'
      category: FeatCategory
    }
  | {
      /** Explicit allow-list of categories. */
      kind: 'categories'
      categories: readonly FeatCategory[]
    }

export type FeatCatalogueEntry = {
  definition: FeatDefinition
  eligibility: FeatEligibility
  /**
   * Committed selection that fails eligibility or entitlement policy.
   * Always kept visible so the player can clear or replace it.
   */
  retainedInvalid: boolean
  /** Capability-overlap recommendation when inventory was provided. */
  overlap: OverlapVerdict
}

export type PartitionFeatCatalogueInput = {
  feats: readonly FeatDefinition[]
  context: FeatEligibilityContext
  policy: FeatEntitlementPolicy
  /** Currently selected feat id for this entitlement (committed or draft). */
  selectedFeatId?: string | null
  /** When true, ineligible feats appear (disabled) alongside eligible ones. */
  showUnavailable: boolean
  /**
   * When true, eligible-but-redundant feats appear (labelled) alongside recommended ones.
   * Default hides them so the catalogue prioritises meaningful choices.
   */
  showRedundant?: boolean
  /** Feat ids excluded from the catalogue entirely (e.g. ASI feat itself). */
  excludeFeatIds?: readonly string[]
  /**
   * Character capability inventory for overlap evaluation.
   * When omitted, all eligible feats are treated as recommended.
   */
  capabilityInventory?: CharacterCapabilityInventory
}

export type PartitionFeatCatalogueResult = {
  /** Entries to render in the selectable catalogue. */
  visible: FeatCatalogueEntry[]
  /** Ineligible entries hidden unless `showUnavailable`. */
  hiddenUnavailable: FeatCatalogueEntry[]
  /** Eligible-but-redundant entries hidden unless `showRedundant`. */
  hiddenRedundant: FeatCatalogueEntry[]
}

function categoryAllowed(
  category: FeatCategory,
  policy: FeatEntitlementPolicy,
): boolean {
  switch (policy.kind) {
    case 'any-qualifying':
      return true
    case 'category':
      return category === policy.category
    case 'categories':
      return policy.categories.includes(category)
  }
}

function entitlementMismatchReason(policy: FeatEntitlementPolicy): string {
  switch (policy.kind) {
    case 'any-qualifying':
      return 'Not available for this feat choice'
    case 'category':
      return `Requires a ${formatCategoryForReason(policy.category)} entitlement`
    case 'categories':
      return `Requires a ${policy.categories.map(formatCategoryForReason).join(' or ')} entitlement`
  }
}

function formatCategoryForReason(category: FeatCategory): string {
  switch (category) {
    case 'origin':
      return 'Origin feat'
    case 'general':
      return 'General feat'
    case 'fighting-style':
      return 'Fighting Style'
    case 'epic-boon':
      return 'Epic Boon'
  }
}

function evaluateOverlapForFeat(
  definition: FeatDefinition,
  inventory: CharacterCapabilityInventory,
): OverlapVerdict {
  return evaluateOptionOverlap(deriveFeatOptionGrants(definition), inventory)
}

/**
 * Entitlement-aware eligibility: category policy first, then character prerequisites.
 */
export function evaluateFeatForEntitlement(
  definition: FeatDefinition,
  context: FeatEligibilityContext,
  policy: FeatEntitlementPolicy,
): FeatEligibility {
  if (!categoryAllowed(definition.category, policy)) {
    return {
      eligible: false,
      reason: entitlementMismatchReason(policy),
    }
  }

  return evaluateFeatEligibility(definition, context)
}

/**
 * Partitions a feat catalogue for entitlement pickers.
 *
 * Default: recommended eligible feats only, plus any committed invalid selection.
 * Optional toggles surface unavailable and/or redundant feats.
 */
export function partitionFeatCatalogue(
  input: PartitionFeatCatalogueInput,
): PartitionFeatCatalogueResult {
  const exclude = new Set(input.excludeFeatIds ?? [])
  const selectedFeatId = input.selectedFeatId ?? null
  const inventory = input.capabilityInventory ?? emptyCapabilityInventory()
  const showRedundant = input.showRedundant === true

  const recommended: FeatCatalogueEntry[] = []
  const redundant: FeatCatalogueEntry[] = []
  const retainedInvalid: FeatCatalogueEntry[] = []
  const unavailable: FeatCatalogueEntry[] = []
  const seenIds = new Set<string>()

  for (const definition of input.feats) {
    if (exclude.has(definition.id)) {
      continue
    }

    const eligibility = evaluateFeatForEntitlement(
      definition,
      input.context,
      input.policy,
    )
    const overlap = evaluateOverlapForFeat(definition, inventory)
    const isSelected = selectedFeatId === definition.id

    if (eligibility.eligible) {
      const entry: FeatCatalogueEntry = {
        definition,
        eligibility,
        retainedInvalid: false,
        overlap,
      }
      seenIds.add(definition.id)
      if (overlap.status === 'redundant') {
        redundant.push(entry)
      } else {
        recommended.push(entry)
      }
      continue
    }

    if (isSelected) {
      retainedInvalid.push({
        definition,
        eligibility,
        retainedInvalid: true,
        overlap,
      })
      seenIds.add(definition.id)
      continue
    }

    unavailable.push({
      definition,
      eligibility,
      retainedInvalid: false,
      overlap,
    })
  }

  if (
    selectedFeatId !== null &&
    !seenIds.has(selectedFeatId) &&
    !exclude.has(selectedFeatId)
  ) {
    const orphan = input.feats.find((feat) => feat.id === selectedFeatId)
    if (orphan !== undefined) {
      retainedInvalid.push({
        definition: orphan,
        eligibility: {
          eligible: false,
          reason: 'This feat is no longer available for this character',
        },
        retainedInvalid: true,
        overlap: { status: 'unavailable', reasons: [] },
      })
    }
  }

  const hiddenRedundant = showRedundant
    ? []
    : redundant.filter((entry) => entry.definition.id !== selectedFeatId)

  const visibleRedundant = showRedundant
    ? redundant
    : redundant.filter((entry) => entry.definition.id === selectedFeatId)

  const visible: FeatCatalogueEntry[] = [
    ...recommended,
    ...visibleRedundant,
    ...retainedInvalid,
  ]

  if (input.showUnavailable) {
    visible.push(...unavailable)
    return {
      visible,
      hiddenUnavailable: [],
      hiddenRedundant,
    }
  }

  return {
    visible,
    hiddenUnavailable: unavailable,
    hiddenRedundant,
  }
}
