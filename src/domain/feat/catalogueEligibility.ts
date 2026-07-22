import type { FeatCategory, FeatDefinition } from './types'
import {
  evaluateFeatEligibility,
  type FeatEligibility,
  type FeatEligibilityContext,
} from './eligibility'

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
}

export type PartitionFeatCatalogueInput = {
  feats: readonly FeatDefinition[]
  context: FeatEligibilityContext
  policy: FeatEntitlementPolicy
  /** Currently selected feat id for this entitlement (committed or draft). */
  selectedFeatId?: string | null
  /** When true, ineligible feats appear (disabled) alongside eligible ones. */
  showUnavailable: boolean
  /** Feat ids excluded from the catalogue entirely (e.g. ASI feat itself). */
  excludeFeatIds?: readonly string[]
}

export type PartitionFeatCatalogueResult = {
  /** Entries to render in the selectable catalogue (order preserved from input after filter). */
  visible: FeatCatalogueEntry[]
  /** Ineligible entries hidden unless `showUnavailable` (excludes retained-invalid). */
  hiddenUnavailable: FeatCatalogueEntry[]
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
 * Default: eligible feats only, plus any committed invalid selection.
 * Optional: surface unavailable feats as disabled entries with reasons.
 */
export function partitionFeatCatalogue(
  input: PartitionFeatCatalogueInput,
): PartitionFeatCatalogueResult {
  const exclude = new Set(input.excludeFeatIds ?? [])
  const selectedFeatId = input.selectedFeatId ?? null

  const eligible: FeatCatalogueEntry[] = []
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
    const isSelected = selectedFeatId === definition.id

    if (eligibility.eligible) {
      eligible.push({
        definition,
        eligibility,
        retainedInvalid: false,
      })
      seenIds.add(definition.id)
      continue
    }

    if (isSelected) {
      retainedInvalid.push({
        definition,
        eligibility,
        retainedInvalid: true,
      })
      seenIds.add(definition.id)
      continue
    }

    unavailable.push({
      definition,
      eligibility,
      retainedInvalid: false,
    })
  }

  // Soft-invalid: selected feat missing from catalogue (wrong edition / pack).
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
      })
    }
  }

  const visible: FeatCatalogueEntry[] = [...eligible, ...retainedInvalid]

  if (input.showUnavailable) {
    visible.push(...unavailable)
    return { visible, hiddenUnavailable: [] }
  }

  return { visible, hiddenUnavailable: unavailable }
}
