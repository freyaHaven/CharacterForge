import type {
  CharacterCapabilityInventory,
  OptionGrant,
  OverlapReason,
  OverlapVerdict,
} from './types'
import { findCapabilityTokens, hasCapability } from './types'

export type GrantCoverage = {
  grant: OptionGrant
  covered: boolean
  sources: OverlapReason['sources']
}

function uniqueSources(
  sources: OverlapReason['sources'],
): OverlapReason['sources'] {
  const seen = new Set<string>()
  const result: OverlapReason['sources'] = []
  for (const source of sources) {
    const key = `${source.kind ?? ''}:${source.id ?? ''}:${source.label}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(source)
  }
  return result
}

function coverGrant(
  grant: OptionGrant,
  inventory: CharacterCapabilityInventory,
): GrantCoverage {
  switch (grant.kind) {
    case 'fixed': {
      const tokens = findCapabilityTokens(
        inventory,
        grant.capability.kind,
        grant.capability.id,
      )
      return {
        grant,
        covered: tokens.length > 0,
        sources: tokens.map((token) => token.source),
      }
    }
    case 'spell-list-access':
    case 'spell-list-picks': {
      const tokens = findCapabilityTokens(
        inventory,
        'spell-list-access',
        grant.listId,
      )
      return {
        grant,
        covered: tokens.length > 0,
        sources: tokens.map((token) => token.source),
      }
    }
  }
}

/**
 * Evaluate whether an option's grants meaningfully expand the character.
 *
 * - No analyzable grants → recommended (cannot claim redundancy from prose)
 * - All analyzable grants already covered → redundant
 * - Otherwise → recommended
 *
 * Unavailability (prereqs / entitlement) is handled by separate eligibility APIs.
 */
export function evaluateOptionOverlap(
  grants: readonly OptionGrant[],
  inventory: CharacterCapabilityInventory,
): OverlapVerdict {
  if (grants.length === 0) {
    return { status: 'recommended', reasons: [] }
  }

  const coverages = grants.map((grant) => coverGrant(grant, inventory))
  const covered = coverages.filter((entry) => entry.covered)
  const uncovered = coverages.filter((entry) => !entry.covered)

  if (uncovered.length > 0) {
    return { status: 'recommended', reasons: [] }
  }

  const sources = uniqueSources(covered.flatMap((entry) => entry.sources))
  const sourceLabels = sources.map((source) => source.label)
  const uniqueLabels = [...new Set(sourceLabels)]

  const message =
    uniqueLabels.length === 0
      ? 'Most benefits overlap with capabilities you already have.'
      : uniqueLabels.length === 1
        ? `Most benefits overlap with your existing ${uniqueLabels[0]} spellcasting.`
        : `Most benefits overlap with capabilities you already have (${uniqueLabels.join('; ')}).`

  // Prefer a spell-list overlap message when all grants are list-related.
  const allListRelated = grants.every(
    (grant) =>
      grant.kind === 'spell-list-access' || grant.kind === 'spell-list-picks',
  )

  return {
    status: 'redundant',
    reasons: [
      {
        code: allListRelated
          ? 'spell-list-overlap'
          : 'capability-fully-covered',
        message: allListRelated
          ? uniqueLabels.length === 1
            ? `Most benefits overlap with your existing ${uniqueLabels[0]} spellcasting.`
            : message
          : message,
        sources,
      },
    ],
  }
}

/** Concrete spell pick: redundant when the character already has that spell. */
export function evaluateSpellPickOverlap(
  spellId: string,
  inventory: CharacterCapabilityInventory,
): OverlapVerdict {
  if (!hasCapability(inventory, 'spell', spellId)) {
    return { status: 'recommended', reasons: [] }
  }

  const sources = findCapabilityTokens(inventory, 'spell', spellId).map(
    (token) => token.source,
  )
  const labels = [...new Set(sources.map((source) => source.label))]

  return {
    status: 'redundant',
    reasons: [
      {
        code: 'spell-already-available',
        message:
          labels.length === 0
            ? 'Already known from another source.'
            : `Already known from: ${labels.join('; ')}`,
        sources: uniqueSources(sources),
      },
    ],
  }
}
